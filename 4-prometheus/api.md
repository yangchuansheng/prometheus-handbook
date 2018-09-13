# 在 HTTP API 中使用 PromQL

Prometheus 当前稳定的 HTTP API 可以通过 `/api/v1` 访问。

## API 响应格式

Prometheus API 使用了 JSON 格式的响应内容。 当 API 调用成功后将会返回 `2xx` 的 HTTP 状态码。

反之，当 API 调用失败时可能返回以下几种不同的 HTTP 状态码：

+ `404 Bad Request` ：当参数错误或者缺失时。
+ `422 Unprocessable Entity` : 当表达式无法执行时。
+ `503 Service Unavailable` : 当请求超时或者被中断时。

所有的 API 请求返回的格式均使用以下的 JSON 格式：

```json
{
  "status": "success" | "error",
  "data": <data>,

  // Only set if status is "error". The data field may still hold
  // additional data.
  "errorType": "<string>",
  "error": "<string>"
}
```

输入时间戳可以由 [RFC3339](https://www.ietf.org/rfc/rfc3339.txt) 格式或者 Unix 时间戳提供，后面可选的小数位可以精确到亚秒级别。输出时间戳以 Unix 时间戳的方式呈现。

查询参数名称可以用中括号 `[]` 重复次数。`<series_selector>` 占位符提供像 `http_requests_total` 或者 `http_requests_total{method=~"(GET|POST)"}` 的 Prometheus 时间序列选择器，并需要在 URL 中编码传输。

`<duration>` 占位符指的是 `[0-9]+[smhdwy]` 形式的 Prometheus 持续时间字符串。例如：5m 表示 5 分钟的持续时间。

`<bool>` 提供布尔值（字符串 true 和 false）。

## 表达式查询

通过 HTTP API 我们可以分别通过 `/api/v1/query` 和 `/api/v1/query_range` 查询 PromQL 表达式当前或者一定时间范围内的计算结果。

### 瞬时数据查询

通过使用 `QUERY API` 我们可以查询 PromQL 在特定时间点下的计算结果。

```bash
GET /api/v1/query
```

URL 请求参数：

+ `query=<string>` : PromQL 表达式。
+ `time=<rfc3339 | unix_timestamp>` : 用于指定用于计算 PromQL 的时间戳。可选参数，默认情况下使用当前系统时间。
+ `timeout=<duration>` : 超时设置。可选参数，默认情况下使用全局设置的参数 `-query.timeout`。

如果 `time` 参数缺省，则使用当前服务器时间。

当 API 调用成功后，Prometheus 会返回 JSON 格式的响应内容，格式如上小节所示。并且在 data 部分返回查询结果。data 部分格式如下：

```json
{
  "resultType": "matrix" | "vector" | "scalar" | "string",
  "result": <value>
}
```

`<value>` 指的是查询结果数据，具体的格式取决于 `resultType`，不同的结果类型，会有不同的结果数据格式。参考 [响应数据格式](https://www.yangcs.net/prometheus/4-prometheus/api.html#响应数据格式)。

例如使用以下表达式查询表达式 `up` 在时间点 `2015-07-01T20:10:51.781Z` 的计算结果：

```json
$ curl 'http://localhost:9090/api/v1/query?query=up&time=2015-07-01T20:10:51.781Z'
{
   "status" : "success",
   "data" : {
      "resultType" : "vector",
      "result" : [
         {
            "metric" : {
               "__name__" : "up",
               "job" : "prometheus",
               "instance" : "localhost:9090"
            },
            "value": [ 1435781451.781, "1" ]
         },
         {
            "metric" : {
               "__name__" : "up",
               "job" : "node",
               "instance" : "localhost:9100"
            },
            "value" : [ 1435781451.781, "0" ]
         }
      ]
   }
}
```

### 区间数据查询

使用 QUERY_RANGE API 我们则可以直接查询 PromQL 表达式在一段时间返回内的计算结果。

```bash
GET /api/v1/query_range
```

URL 请求参数：

+ `query=<string>` : PromQL 表达式。
+ `start=<rfc3339 | unix_timestamp>` : 起始时间戳。
+ `end=<rfc3339 | unix_timestamp>` : 结束时间戳。
+ `step=<duration | float>` : 查询时间步长，时间区间内每 step 秒执行一次。
+ `timeout=<duration>` : 超时设置。可选参数，默认情况下使用全局设置的参数 `-query.timeout`。

当使用 QUERY_RANGE API 查询 PromQL 表达式时，返回结果一定是一个区间向量：

```json
{
  "resultType": "matrix",
  "result": <value>
}
```

<br />

> **[info]** 注意
>
> 在 QUERY_RANGE API 中 PromQL 只能使用瞬时向量选择器类型的表达式。

<br />

对于 `<value>` 占位符的格式，详见 [区间向量查询结果格式](https://www.yangcs.net/prometheus/4-prometheus/api.html#区间向量)。

例如使用以下表达式查询表达式 `up` 在 30 秒范围内以 15 秒为间隔计算 PromQL 表达式的结果。

```json
$ curl 'http://localhost:9090/api/v1/query_range?query=up&start=2015-07-01T20:10:30.781Z&end=2015-07-01T20:11:00.781Z&step=15s'
{
   "status" : "success",
   "data" : {
      "resultType" : "matrix",
      "result" : [
         {
            "metric" : {
               "__name__" : "up",
               "job" : "prometheus",
               "instance" : "localhost:9090"
            },
            "values" : [
               [ 1435781430.781, "1" ],
               [ 1435781445.781, "1" ],
               [ 1435781460.781, "1" ]
            ]
         },
         {
            "metric" : {
               "__name__" : "up",
               "job" : "node",
               "instance" : "localhost:9091"
            },
            "values" : [
               [ 1435781430.781, "0" ],
               [ 1435781445.781, "0" ],
               [ 1435781460.781, "1" ]
            ]
         }
      ]
   }
}
```

## 查询元数据

### 通过标签选择器查找时间序列

以下表达式返回与特定标签集匹配的时间序列列表：

```bash
GET /api/v1/series
```

URL 请求参数：

+ `match[]=<series_selector>` : 表示标签选择器是 `series_selector`。必须至少提供一个 `match[]` 参数。
+ `start=<rfc3339 | unix_timestamp>` : 起始时间戳。
+ `end=<rfc3339 | unix_timestamp>` : 结束时间戳。

返回结果的 data 部分，是由 key-value 键值对的对象列表组成的。

例如使用以下表达式查询表达式 `up` 或 `process_start_time_seconds{job="prometheus"}` 的计算结果：

```json
$ curl -g 'http://localhost:9090/api/v1/series?match[]=up&match[]=process_start_time_seconds{job="prometheus"}'
{
   "status" : "success",
   "data" : [
      {
         "__name__" : "up",
         "job" : "prometheus",
         "instance" : "localhost:9090"
      },
      {
         "__name__" : "up",
         "job" : "node",
         "instance" : "localhost:9091"
      },
      {
         "__name__" : "process_start_time_seconds",
         "job" : "prometheus",
         "instance" : "localhost:9090"
      }
   ]
}
```

### 查询标签值

下面这个例子返回了带有指定标签的的时间序列列表：

```bash
GET /api/v1/label/<label_name>/values
```

返回结果的 `data` 部分是一个标签值列表。例如，以下表达式返回结果的 data 部分是标签名称为 `job` 的所有标签值：

```json
$ curl http://localhost:9090/api/v1/label/job/values
{
   "status" : "success",
   "data" : [
      "node",
      "prometheus"
   ]
}
```

## 响应数据格式

表达式查询结果可能会在 data 部分的 `result` 字段中返回以下的响应值。其中 `<sample_value>` 占位符是数值样本值。由于 json 不支持特殊浮点值，例如：`NaN`, `Inf`, 和 `-Inf`，所以样本值将会作为字符串（而不是原始数值）来进行传输。

### 区间向量

当返回数据类型 resultType 为 `matrix` 时，`result` 响应格式如下：

```json
[
  {
    "metric": { "<label_name>": "<label_value>", ... },
    "values": [ [ <unix_time>, "<sample_value>" ], ... ]
  },
  ...
]
```

其中 `metrics` 表示当前时间序列的特征维度，`values` 包含当前事件序列的一组样本。

### 瞬时向量

当返回数据类型 resultType 为 `vector` 时，`result` 响应格式如下：

```json
[
  {
    "metric": { "<label_name>": "<label_value>", ... },
    "value": [ <unix_time>, "<sample_value>" ]
  },
  ...
]
```

其中 `metrics` 表示当前时间序列的特征维度，`values` 包含当前事件序列的一组样本。

### 标量

当返回数据类型 resultType 为 `scalar` 时，`result` 响应格式如下：

```json
[ <unix_time>, "<scalar_value>" ]
```

由于标量不存在时间序列一说，因此 `result` 表示为当前系统时间一个标量的值。

### 字符串

当返回数据类型 resultType 为 `string` 时，`result` 响应格式如下：

```json
[ <unix_time>, "<string_value>" ]
```

字符串类型的响应内容格式和标量相同。


















