# PromQL 内置函数

Prometheus 提供了其它大量的内置函数，可以对时序数据进行丰富的处理。某些函数有默认的参数，例如：`year(v=vector(time()) instant-vector)`。其中参数 `v` 是一个瞬时向量，如果不提供该参数，将使用默认值 `vector(time())`。instant-vector 表示参数类型。

## abs()

`abs(v instant-vector)` 返回输入向量的所有样本的绝对值。

## absent()

`absent(v instant-vector)`，如果传递给它的向量参数具有样本数据，则返回空向量；如果传递的向量参数没有样本数据，则返回不带度量指标名称且带有标签的时间序列，且样本值为1。

当监控度量指标时，如果获取到的样本数据是空的， 使用 absent 方法对告警是非常有用的。例如：

```bash
# 这里提供的向量有样本数据
absent(http_requests_total{method="get"})  => no data
absent(sum(http_requests_total{method="get"}))  => no data

# 由于不存在度量指标 nonexistent，所以 返回不带度量指标名称且带有标签的时间序列，且样本值为1
absent(nonexistent{job="myjob"})  => {job="myjob"}  1
# 正则匹配的 instance 不作为返回 labels 中的一部分
absent(nonexistent{job="myjob",instance=~".*"})  => {job="myjob"}  1

# sum 函数返回的时间序列不带有标签，且没有样本数据
absent(sum(nonexistent{job="myjob"}))  => {}  1
```

## ceil()

`ceil(v instant-vector)` 将 v 中所有元素的样本值向上四舍五入到最接近的整数。例如：

```bash
node_load5{instance="192.168.1.75:9100"} # 结果为 2.79
ceil(node_load5{instance="192.168.1.75:9100"}) # 结果为 3
```

## changes()

`changes(v range-vector)` 输入一个区间向量， 返回这个区间向量内每个样本数据值变化的次数（瞬时向量）。例如：

```bash
# 如果样本数据值没有发生变化，则返回结果为 1
changes(node_load5{instance="192.168.1.75:9100"}[1m]) # 结果为 1
```

## clamp_max()

`clamp_max(v instant-vector, max scalar)` 函数，输入一个瞬时向量和最大值，样本数据值若大于 max，则改为 max，否则不变。例如：

```bash
node_load5{instance="192.168.1.75:9100"} # 结果为 2.79
clamp_max(node_load5{instance="192.168.1.75:9100"}, 2) # 结果为 2
```

## clamp_min()

`clamp_min(v instant-vector, min scalar)` 函数，输入一个瞬时向量和最小值，样本数据值若小于 min，则改为 min，否则不变。例如：

```bash
node_load5{instance="192.168.1.75:9100"} # 结果为 2.79
clamp_min(node_load5{instance="192.168.1.75:9100"}, 3) # 结果为 3
```

## day_of_month()

`day_of_month(v=vector(time()) instant-vector)` 函数，返回被给定 UTC 时间所在月的第几天。返回值范围：1~31。

## day_of_week()

`day_of_week(v=vector(time()) instant-vector)` 函数，返回被给定 UTC 时间所在周的第几天。返回值范围：0~6，0 表示星期天。

## days_in_month()

`days_in_month(v=vector(time()) instant-vector)` 函数，返回当月一共有多少天。返回值范围：28~31。

## delta()

`delta(v range-vector)` 的参数是一个区间向量，返回一个瞬时向量。它计算一个区间向量 v 的第一个元素和最后一个元素之间的差值。由于这个值被外推到指定的整个时间范围，所以即使样本值都是整数，你仍然可能会得到一个非整数值。

例如，下面的例子返回过去两小时的 CPU 温度差：

```bash
delta(cpu_temp_celsius{host="zeus"}[2h])
```

这个函数一般只用在 Gauge 类型的时间序列上。

## deriv()

`deriv(v range-vector)` 的参数是一个区间向量,返回一个瞬时向量。它使用[简单的线性回归](http://en.wikipedia.org/wiki/Simple_linear_regression)计算区间向量 v 中各个时间序列的导数。

这个函数一般只用在 Gauge 类型的时间序列上。

## exp()

`exp(v instant-vector)` 函数，输入一个瞬时向量，返回各个样本值的 `e` 的指数值，即 e 的 N 次方。当 N 的值足够大时会返回 `+Inf`。特殊情况为：

+ `Exp(+Inf) = +Inf`
+ `Exp(NaN) = NaN`

## floor()

`floor(v instant-vector)` 函数与 ceil() 函数相反，将 v 中所有元素的样本值向下四舍五入到最接近的整数。

## histogram_quantile()












