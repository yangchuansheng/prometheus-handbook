# 简单示例

## 简单的时间序列选择

返回度量指标 `http_requests_total` 的所有时间序列样本数据：

```bash
http_requests_total
```

返回度量指标名称为 `http_requests_total`，标签分别是 `job="apiserver"`, `handler="/api/comments"` 的所有时间序列样本数据：

```bash
http_requests_total{job="apiserver", handler="/api/comments"}
```

返回度量指标名称为 `http_requests_total`，标签分别是 `job="apiserver"`, `handler="/api/comments"`，且是 5 分钟内的所有时间序列样本数据：

```bash
http_requests_total{job="apiserver", handler="/api/comments"}[5m]
```

<br />

> **[info] 注意**
>
> 一个区间向量表达式不能直接展示在 `Graph` 图表中，但是可以展示在 `Console` 视图中。

<br />

使用正则表达式，你可以通过特定模式匹配标签为 `job` 的特定任务名，获取这些任务的时间序列。在下面这个例子中, 所有任务名称以 `server` 结尾。

```bash
http_requests_total{job=~".*server"}
```

Prometheus中的所有正则表达式都使用 [RE2 语法](https://github.com/google/re2/wiki/Syntax)

返回度量指标名称是 `http_requests_total`， 且 http 返回码不以 `4` 开头的所有时间序列数据：

```bash
http_requests_total{status!~"4.."}
```

## 使用函数，操作符等

返回度量指标 `http_requests_total` 过去 5 分钟内的 http 请求数的平均增长速率：

```bash
rate(http_requests_total[5m])
```

返回度量指标 `http_requests_total` 过去 5 分钟内的 http 请求数的平均增长速率总和，维度是 `job`：

```bash
sum(rate(http_requests_total[5m])) by (job)
结果：
{job="apiserver"}  0.16666666666666666
{job="kubelet"}  0.49999876544124355
```

如果两个指标具有相同维度的标签，我们可以使用二元操作符计算样本数据，返回值：key: value=标签列表：计算样本值。例如，以下表达式返回每一个实例的空闲内存，单位是 MiB。

```bash
(instance_memory_limit_bytes - instance_memory_usage_bytes) / 1024 / 1024
```

如果想知道每个应用的剩余内存，可以使用如下表达式：

```bash
sum(
  instance_memory_limit_bytes - instance_memory_usage_bytes
) by (app, proc) / 1024 / 1024
```

如果相同的集群调度群显示如下的每个实例的 CPU 使用率：

```bash
instance_cpu_time_ns{app="lion", proc="web", rev="34d0f99", env="prod", job="cluster-manager"}
instance_cpu_time_ns{app="elephant", proc="worker", rev="34d0f99", env="prod", job="cluster-manager"}
instance_cpu_time_ns{app="turtle", proc="api", rev="4d3a513", env="prod", job="cluster-manager"}
instance_cpu_time_ns{app="fox", proc="widget", rev="4d3a513", env="prod", job="cluster-manager"}
...
```

我们可以按照应用和进程类型来获取 CPU 利用率最高的 3 个样本数据：

```bash
topk(3, sum(rate(instance_cpu_time_ns[5m])) by (app, proc))
```

假设一个服务实例只有一个时间序列数据，那么我们可以通过下面表达式统计出每个应用的实例数量：

```bash
count(instance_cpu_time_ns) by (app)
```








