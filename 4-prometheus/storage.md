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













