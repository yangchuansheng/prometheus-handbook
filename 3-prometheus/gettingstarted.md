# 快速开始

> 译者：[詹叶](https://heisenbergye.github.io/)

本文类似 “Hello World” 的向导，教你怎么安装，配置，并且用一个简单的例子演示如何使用 Prometheus。你可以在本地下载并运行 Prometheus，配置以采集自身和示例应用的运行数据，然后使用查询语句，规则和图形来使用收集到的时间序列数据。

## 下载和运行 Prometheus

为你的平台下载[最新版本的 Prometheus](https://prometheus.io/download)，执行以下命令解压：

```bash
tar xvfz prometheus-*.tar.gz
cd prometheus-*
```

在启动 Prometheus 之前，我们先做一些配置。

## 配置 Prometheus 来监控自己

Prometheus 通过在目标节点的 HTTP 端口上采集 metrics（遥测专用词，度量指标）来监控目标节点（以下会称为“采样目标”）。因为 Prometheus 也以相同的方式暴露自己的数据，所以他也可以采集和检查自己的健康状况。

虽然在生产实践中 Prometheus 服务器只收集自己的数据没多大作用，但是这是个不错的入门示例。保存以下基础配置到文件 prometheus.yml 中：

```yaml
global:
  scrape_interval:     15s # By default, scrape targets every 15 seconds.

  # Attach these labels to any time series or alerts when communicating with
  # external systems (federation, remote storage, Alertmanager).
  external_labels:
    monitor: 'codelab-monitor'

# A scrape configuration containing exactly one endpoint to scrape:
# Here it's Prometheus itself.
scrape_configs:
  # The job name is added as a label `job=<job_name>` to any timeseries scraped from this config.
  - job_name: 'prometheus'

    # Override the global default and scrape targets from this job every 5 seconds.
    scrape_interval: 5s

    static_configs:
      - targets: ['localhost:9090']
```

完整配置选项说明，请查看[配置文档](https://prometheus.io/docs/prometheus/latest/configuration/configuration/)

## 启动 Prometheus

使用上一步创建的配置文件启动 Prometheus，修改以下命令为你的平台中 Prometheus 二进制文件所在路径，执行命令启动：

```bash
# Start Prometheus.
# By default, Prometheus stores its database in ./data (flag --storage.tsdb.path).
./prometheus --config.file=prometheus.yml
```

此时 Prometheus 应该启动了。你应该也可以通过浏览器打开状态页面 [localhost:9090](localhost:9090)。稍等几秒钟 Prometheus 就可以从自己的 HTTP metrics 端点收集自己的数据。

你也可以访问 metrics 端点 [localhost:9090/metrics](localhost:9090/metrics) 验证 Prometheus 是否正在提供 metrics 服务。

## 使用表达式浏览器

让我们来看看 Prometheus 已经收集到的自己的 metrics 数据。为了使用 Prometheus 内置的表达式浏览器，访问 [http://localhost:9090/graph](http://localhost:9090/graph) 选择"Graph" 标签页中的 “Console” 视图

正如你可以从 [localhost:9090/metrics](localhost:9090/metrics) 收集 metrics，Prometheus 暴露的一个度量指标称为 prometheus_target_interval_length_seconds（目标擦除之间的实际时间量）。继续在表达式控制台输入：

```
prometheus_target_interval_length_seconds
```

此时应该返回许多不同的时间序列(以及每条记录的最新值)，所有时间序列都有 metric 名称 prometheus_target_interval_length_seconds ，但具有不同的标签。这些标签指定不同延迟百分比和目标组间隔。

如果我们只关心99%延迟，可以使用以下查询语句来检索信息：

```
prometheus_target_interval_length_seconds{quantile="0.99"}
```

要计算返回的时间序列数量，可以输入：

```
count(prometheus_target_interval_length_seconds)
```

更多表达式语言，请看 [expression language documentation](https://prometheus.io/docs/prometheus/latest/querying/basics/)

## 使用绘图接口

访问 [http://localhost:9090/graph](http://localhost:9090/graph) 并选择"Graph" 标签页，打开图形绘制界面

例如，输入以下表达式来绘制 Prometheus 自我采集每秒创建块的速率：

```
rate(prometheus_tsdb_head_chunks_created_total[1m])
```

实验采用图形范围参数和其他设置。

## 启动一些示例应用

让我们玩点更有意思的东西，启动一些样例目标让 Prometheus 采集。

Go 客户端库包含一个示例，该示例为具有不同延迟分布的三个服务暴露 RPC 延迟。

确保你已经安装了 [Go 语言编译器](https://golang.org/doc/install)并且指定 [Go 工作目录](https://golang.org/doc/code.html) (在环境变量中指定正确的 GOPATH)

下载 Prometheus 的 Go 客户端库并运行这三个示例：

```bash
# Fetch the client library code and compile example.
git clone https://github.com/prometheus/client_golang.git
cd client_golang/examples/random
go get -d
go build

# Start 3 example targets in separate terminals:
./random -listen-address=:8080
./random -listen-address=:8081
./random -listen-address=:8082
```

此时监听目标启动 http://localhost:8080/metrics, http://localhost:8081/metrics 和 http://localhost:8082/metrics

## 配置 Prometheus 来监控示例目标

现在我们配置 Prometheus 来采集这些新的目标。让我们将这三个目标分组到一个名为 ```example-random```的作业。但是，假设前两个端点（即： http://localhost:8080/metrics, http://localhost:8081/metrics ）都是生产级目标应用，第三个端点（即： http://localhost:8082/metrics ）为金丝雀实例。要在 Prometheus 中对此进行建模，我们可以将多组端点添加到单个作业中，为每组目标添加额外的标签。 在此示例中，我们将 ```group =“production”``` 标签添加到第一组目标，同时将 ```group =“canary”``` 添加到第二组。

要实现此目的，请将以下作业定义添加到 ```prometheus.yml``` 中的 ```scrape_configs``` 部分，然后重新启动 Prometheus 实例：

```yaml
scrape_configs:
  - job_name:       'example-random'

    # Override the global default and scrape targets from this job every 5 seconds.
    scrape_interval: 5s

    static_configs:
      - targets: ['localhost:8080', 'localhost:8081']
        labels:
          group: 'production'

      - targets: ['localhost:8082']
        labels:
          group: 'canary'
```

转到表达式浏览器并验证 Prometheus 现在是否有关于这些示例端点公开的时间序列的信息，例如 rpc_durations_seconds 的 metric 指标。

## 配置规则聚合抓取的数据到新的时间序列

在计算ad-hoc时，聚合了上千个时间序列会使查询会变慢，虽然在我们的示例中不会有这样的问题。 为了提高效率，Prometheus允许您通过配置的录制规则将表达式预先记录到全新的持久时间序列中。假设我们关心的是记录在5分钟窗口内测量的所有实例（但保留作业和服务维度）的 RPC 的平均每秒速率（rpc_durations_seconds_count）。 我们可以这样写：

```
avg(rate(rpc_durations_seconds_count[5m])) by (job, service)
```

尝试绘制此表达式。

要将此表达式生成的时间序列记录到名为 `job_service：rpc_durations_seconds_count：avg_rate5m` 的新的 metric 指标中，请使用以下记录规则创建一个文件并将其另存为`prometheus.rules.yml`：

```yaml
groups:
- name: example
  rules:
  - record: job_service:rpc_durations_seconds_count:avg_rate5m
    expr: avg(rate(rpc_durations_seconds_count[5m])) by (job, service)
```

要使 Prometheus 使用此新规则，需要在 `prometheus.yml` 中添加 `rule_files` 语句。 配置现在应该如下所示：

```yaml
global:
  scrape_interval:     15s # By default, scrape targets every 15 seconds.
  evaluation_interval: 15s # Evaluate rules every 15 seconds.

  # Attach these extra labels to all timeseries collected by this Prometheus instance.
  external_labels:
    monitor: 'codelab-monitor'

rule_files:
  - 'prometheus.rules.yml'

scrape_configs:
  - job_name: 'prometheus'

    # Override the global default and scrape targets from this job every 5 seconds.
    scrape_interval: 5s

    static_configs:
      - targets: ['localhost:9090']

  - job_name:       'example-random'

    # Override the global default and scrape targets from this job every 5 seconds.
    scrape_interval: 5s

    static_configs:
      - targets: ['localhost:8080', 'localhost:8081']
        labels:
          group: 'production'

      - targets: ['localhost:8082']
        labels:
          group: 'canary'
```

重启 Prometheus 是新配置生效，并通过表达式浏览器查询或绘制图表来验证带有新 metric 指标名称 `job_service：rpc_durations_seconds_count：avg_rate5m` 的新时间序列现在可用。

