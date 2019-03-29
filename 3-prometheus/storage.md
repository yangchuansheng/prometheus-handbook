# 存储

Prometheus 2.x 默认将时间序列数据库保存在本地磁盘中，同时也可以将数据保存到任意第三方的存储服务中。

## 本地存储

Prometheus 采用自定义的存储格式将样本数据保存在本地磁盘当中。

### 存储格式

Prometheus 按照两个小时为一个时间窗口，将两小时内产生的数据存储在一个块（Block）中。每个块都是一个单独的目录，里面含该时间窗口内的所有样本数据（chunks），元数据文件（meta.json）以及索引文件（index）。其中索引文件会将指标名称和标签索引到样板数据的时间序列中。此期间如果通过 API 删除时间序列，删除记录会保存在单独的逻辑文件 `tombstone` 当中。

当前样本数据所在的块会被直接保存在内存中，不会持久化到磁盘中。为了确保 Prometheus 发生崩溃或重启时能够恢复数据，Prometheus 启动时会通过预写日志（write-ahead-log(WAL)）重新记录，从而恢复数据。预写日志文件保存在 `wal` 目录中，每个文件大小为 `128MB`。wal 文件包括还没有被压缩的原始数据，所以比常规的块文件大得多。一般情况下，Prometheus 会保留三个 wal 文件，但如果有些高负载服务器需要保存两个小时以上的原始数据，wal 文件的数量就会大于 3 个。

Prometheus保存块数据的目录结构如下所示：

```bash
./data 
   |- 01BKGV7JBM69T2G1BGBGM6KB12 # 块
      |- meta.json  # 元数据
      |- wal        # 写入日志
        |- 000002
        |- 000001
   |- 01BKGTZQ1SYQJTR4PB43C8PD98  # 块
      |- meta.json  #元数据
      |- index   # 索引文件
      |- chunks  # 样本数据
        |- 000001
      |- tombstones # 逻辑数据
   |- 01BKGTZQ1HHWHV8FBJXW1Y3W0K
      |- meta.json
      |- wal
        |-000001
```

最初两个小时的块最终会在后台被压缩成更长的块。

> **[info] 注意**
>
> 本地存储不可复制，无法构建集群，如果本地磁盘或节点出现故障，存储将无法扩展和迁移。因此我们只能把本地存储视为近期数据的短暂滑动窗口。如果你对数据持久化的要求不是很严格，可以使用本地磁盘存储多达数年的数据。

关于存储格式的详细信息，请参考 [TSDB 格式](https://github.com/prometheus/tsdb/blob/master/docs/format/README.md)

### 本地存储配置

Prometheus 提供了几个参数来修改本地存储的配置，最主要的有：

|           启动参数            | 默认值 |                             含义                             |
| :---------------------------: | :----: | :----------------------------------------------------------: |
|      --storage.tsdb.path      | /data  |                         数据存储路径                         |
| --storage.tsdb.retention.time |  15d   | 样本数据在存储中保存的时间。超过该时间限制的数据就会被删除。 |
| --storage.tsdb.retention.size |   0    | 每个块的最大字节数（不包括 wal 文件）。如果超过限制，最早的样本数据会被优先删除。支持的单位有 KB, MB, GB, PB，例如：“512MB”。该参数只是试验性的，可能会在未来的版本中被移除。 |
|   --storage.tsdb.retention    |        | 该参数从 2.7 版本开始已经被弃用，使用 --storage.tsdb.retention.time 参数替代 |

在一般情况下，Prometheus 中存储的每一个样本大概占用1-2字节大小。如果需要对 Prometheus Server 的本地磁盘空间做容量规划时，可以通过以下公式计算：

```bash
needed_disk_space = retention_time_seconds * ingested_samples_per_second * bytes_per_sample
```

从上面公式中可以看出在保留时间（retention_time_seconds）和样本大小（bytes_per_sample）不变的情况下，如果想减少本地磁盘的容量需求，只能通过减少每秒获取样本数（ingested_samples_per_second）的方式。因此有两种手段，一是减少时间序列的数量，二是增加采集样本的时间间隔。考虑到 Prometheus 会对时间序列进行压缩效率，减少时间序列的数量效果更明显。

如果你的本地存储出现故障，最好的办法是停止运行 Prometheus 并删除整个存储目录。因为 Prometheus 的本地存储不支持非 POSIX 兼容的文件系统，一旦发生损坏，将无法恢复。NFS 只有部分兼容 POSIX，大部分实现都不兼容 POSIX。

除了删除整个目录之外，你也可以尝试删除个别块目录来解决问题。删除每个块目录将会丢失大约两个小时时间窗口的样本数据。所以，**Prometheus 的本地存储并不能实现长期的持久化存储。**

如果同时指定了样本数据在存储中保存的时间和大小，则哪一个参数的限制先触发，就执行哪个参数的策略。

## 远程存储

Prometheus 的本地存储无法持久化数据，无法灵活扩展。为了保持Prometheus的简单性，Prometheus并没有尝试在自身中解决以上问题，而是通过定义两个标准接口（remote_write/remote_read），让用户可以基于这两个接口对接将数据保存到任意第三方的存储服务中，这种方式在 Promthues 中称为 Remote Storage。

Prometheus 可以通过两种方式来集成远程存储。

### Remote Write

用户可以在 Prometheus 配置文件中指定 Remote Write（远程写）的 URL 地址，一旦设置了该配置项，Prometheus 将采集到的样本数据通过 HTTP 的形式发送给适配器（Adaptor）。而用户则可以在适配器中对接外部任意的服务。外部服务可以是真正的存储系统，公有云的存储服务，也可以是消息队列等任意形式。

![](https://ws4.sinaimg.cn/large/006tKfTcly1g1ji8gm9f0j314u06aglz.jpg)

### Remote Read

如下图所示，Promthues 的 Remote Read（远程读）也通过了一个适配器实现。在远程读的流程当中，当用户发起查询请求后，Promthues 将向 remote_read 中配置的 URL 发起查询请求（matchers,ranges），`Adaptor` 根据请求条件从第三方存储服务中获取响应的数据。同时将数据转换为 Promthues 的原始样本数据返回给 Prometheus Server。

当获取到样本数据后，Promthues 在本地使用 PromQL 对样本数据进行二次处理。

> **[info] 注意**
>
> 启用远程读设置后，Prometheus 仅从远程存储读取一组时序样本数据（根据标签选择器和时间范围），对于规则文件的处理，以及 Metadata API 的处理都只基于 Prometheus 本地存储完成。这也就意味着远程读在扩展性上有一定的限制，因为所有的样本数据都要首先加载到 Prometheus Server，然后再进行处理。所以 Prometheus 暂时不支持完全分布式处理。

![](https://ws4.sinaimg.cn/large/006tKfTcly1g1jidjvbx8j316006074t.jpg)

远程读和远程写协议都使用了基于 HTTP 的 snappy 压缩协议的缓冲区编码，目前还不稳定，在以后的版本中可能会被替换成基于 HTTP/2 的 `gRPC` 协议，前提是 Prometheus 和远程存储之间的所有通信都支持 HTTP/2。

### 配置文件

想知道如何在 Prometheus 中添加远程存储的配置，请参考前面的章节：[配置远程写](https://www.yangcs.net/prometheus/3-prometheus/configuration.html#remote_write) 和 [配置远程读](https://www.yangcs.net/prometheus/3-prometheus/configuration.html#remote_read)。

关于请求与响应消息的详细信息，可以查看远程存储相关协议的 proto 文件：

```go
syntax = "proto3";
package prometheus;

option go_package = "prompb";

import "types.proto";
import "gogoproto/gogo.proto";

message WriteRequest {
  repeated prometheus.TimeSeries timeseries = 1 [(gogoproto.nullable) = false];
}

message ReadRequest {
  repeated Query queries = 1;
}

message ReadResponse {
  // In same order as the request's queries.
  repeated QueryResult results = 1;
}

message Query {
  int64 start_timestamp_ms = 1;
  int64 end_timestamp_ms = 2;
  repeated prometheus.LabelMatcher matchers = 3;
  prometheus.ReadHints hints = 4;
}

message QueryResult {
  // Samples within a time series must be ordered by time.
  repeated prometheus.TimeSeries timeseries = 1;
}
```

### 支持的远程存储

目前 Prometheus 社区也提供了部分对于第三方数据库的 Remote Storage 支持：

| 存储服务                                                     | 支持模式   |
| ------------------------------------------------------------ | ---------- |
| [AppOptics](https://github.com/solarwinds/prometheus2appoptics) | write      |
| [Chronix](https://github.com/ChronixDB/chronix.ingester)     | write      |
| [Cortex](https://github.com/cortexproject/cortex)            | read/write |
| [CrateDB](https://github.com/crate/crate_adapter)            | read/write |
| [Elasticsearch](https://github.com/infonova/prometheusbeat)  | write      |
| [Gnocchi](https://gnocchi.xyz/prometheus.html)               | write      |
| [Graphite](https://github.com/prometheus/prometheus/tree/master/documentation/examples/remote_storage/remote_storage_adapter) | write      |
| [InfluxDB](https://docs.influxdata.com/influxdb/latest/supported_protocols/prometheus) | read/write |
| [IRONdb](https://github.com/circonus-labs/irondb-prometheus-adapter) | read/write |
| [Kafka](https://github.com/Telefonica/prometheus-kafka-adapter) | write      |
| [M3DB](https://m3db.github.io/m3/integrations/prometheus)    | read/write |
| [OpenTSDB](https://github.com/prometheus/prometheus/tree/master/documentation/examples/remote_storage/remote_storage_adapter) | write      |
| [PostgreSQL/TimescaleDB](https://github.com/timescale/prometheus-postgresql-adapter) | read/write |
| [SignalFx](https://github.com/signalfx/metricproxy#prometheus) | write      |
| [Splunk](https://github.com/lukemonahan/splunk_modinput_prometheus#prometheus-remote-write) | write      |
| [TiKV](https://github.com/bragfoo/TiPrometheus)              | read/write |
| [VictoriaMetrics](https://github.com/VictoriaMetrics/VictoriaMetrics) | write      |
| [Wavefront](https://github.com/wavefrontHQ/prometheus-storage-adapter) | write      |

更多信息请查看[集成文档](https://www.yangcs.net/prometheus/6-operating/integrations.html#remote-endpoints-and-storage)。



