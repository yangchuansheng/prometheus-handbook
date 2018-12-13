# 数据模型

Prometheus 所有采集的监控数据均以指标（metric）的形式保存在内置的[时间序列](https://www.wikiwand.com/zh/%E6%99%82%E9%96%93%E5%BA%8F%E5%88%97)数据库当中（TSDB）。每一条时间序列由指标名称（Metrics Name）以及一组标签（Labels）唯一标识，每条时间序列按照时间的先后顺序存储一系列的样本值。除了存储时间序列数据外，Prometheus 还可以临时生成时间序列数据作为查询的返回结果。

## 指标名称和标签

每一条时间序列由指标名称（Metrics Name）以及一组标签（键值对）唯一标识。其中指标的名称（metric name）可以反映被监控样本的含义（例如，`http_requests_total` — 表示当前系统接收到的 HTTP 请求总量），指标名称只能由 ASCII 字符、数字、下划线以及冒号组成，同时必须匹配正则表达式 `[a-zA-Z_:][a-zA-Z0-9_:]*`。

> **[info] 注意**
>
> 冒号用来表示用户自定义的记录规则，不能在 exporter 中或监控对象直接暴露的指标中使用冒号来定义指标名称。

通过使用标签，Prometheus 开启了强大的多维数据模型：对于相同的指标名称，通过不同标签列表的集合，会形成特定的度量维度实例（例如：所有包含度量名称为 `/api/tracks` 的 http 请求，打上 `method=POST` 的标签，就会形成具体的 http 请求）。该查询语言在这些指标和标签列表的基础上进行过滤和聚合。改变任何度量指标上的任何标签值（包括添加或删除指标），都会创建新的时间序列。

标签的名称只能由 ASCII 字符、数字以及下划线组成并满足正则表达式 `[a-zA-Z_][a-zA-Z0-9_]*`。其中以 `__` 作为前缀的标签，是系统保留的关键字，只能在系统内部使用。标签的值则可以包含任何 `Unicode` 编码的字符。

更多详细内容请参考 [指标和标签命名最佳实践](../practices/naming.html)。

## 样本

在时间序列中的每一个点称为一个样本（sample），样本由以下三部分组成：

+ 指标（metric）：指标名称和描述当前样本特征的 labelsets；
+ 时间戳（timestamp）：一个精确到毫秒的时间戳；
+ 样本值（value）： 一个 folat64 的浮点型数据表示当前样本的值。

## 符号

表示一个度量指标和一组键值对标签，需要使用以下符号：

```bash
<metric name>{<label name>=<label value>, ...}
```

例如，指标名称为 `api_http_requests_total`，标签为 `method="POST"` 和 `handler="/messages"` 的时间序列可以表示为：

```bash
api_http_requests_total{method="POST", handler="/messages"}
```

这与 [OpenTSDB](http://opentsdb.net/) 中使用的符号相同。