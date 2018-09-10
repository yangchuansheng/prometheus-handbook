# 操作符

## 二元运算符

Prometheus 的查询语言支持基本的逻辑运算和算术运算。对于两个瞬时向量, [匹配行为](https://prometheus.io/docs/prometheus/latest/querying/operators/#vector-matching)可以被改变。

### 算术二元运算符

在 Prometheus 系统中支持下面的二元算术运算符：

+ `+` 加法
+ `-` 减法
+ `*` 乘法
+ `/` 除法
+ `%` 模
+ `^` 幂等

二元运算操作符支持 `scalar/scalar(标量/标量)`、`vector/scalar(向量/标量)`、和 `vector/vector(向量/向量)` 之间的操作。

在两个标量之间进行数学运算，得到的结果也是标量。

在向量和标量之间，这个运算符会作用于这个向量的每个样本值上。例如：如果一个时间序列瞬时向量除以 2，操作结果也是一个新的瞬时向量，且度量指标名称不变, 它是原度量指标瞬时向量的每个样本值除以 2。

如果是瞬时向量与瞬时向量之间进行数学运算时，过程会相对复杂一点，运算符会依次找到与左边向量元素匹配（标签完全一致）的右边向量元素进行运算，如果没找到匹配元素，则直接丢弃。同时新的时间序列将不会包含指标名称。

例如，如果我们想根据 `node_disk_bytes_written` 和 `node_disk_bytes_read` 获取主机磁盘IO的总量，可以使用如下表达式：

```bash
node_disk_bytes_written + node_disk_bytes_read
```

该表达式返回结果的示例如下所示：

```bash
{device="sda",instance="localhost:9100",job="node_exporter"}=>1634967552@1518146427.807 + 864551424@1518146427.807
{device="sdb",instance="localhost:9100",job="node_exporter"}=>0@1518146427.807 + 1744384@1518146427.807
```

### 布尔运算符

目前，Prometheus 支持以下布尔运算符：

+ `==` (相等)
+ `!=` (不相等)
+ `>` (大于)
+ `<` (小于)
+ `>=` (大于等于)
+ `<=` (小于等于)

布尔运算符被应用于 `scalar/scalar（标量/标量）`、`vector/scalar（向量/标量）`，和`vector/vector（向量/向量）`。默认情况下布尔运算符只会根据时间序列中样本的值，对时间序列进行过滤。我们可以通过在运算符后面使用 `bool` 修饰符来改变布尔运算的默认行为。使用 bool 修改符后，布尔运算不会对时间序列进行过滤，而是直接依次瞬时向量中的各个样本数据与标量的比较结果 `0` 或者 `1`。

在两个标量之间进行布尔运算，必须提供 bool 修饰符，得到的结果也是标量，即 `0`（`false`）或 `1`（`true`）。例如：

```bash
2 > bool 1 # 结果为 1
```

瞬时向量和标量之间的布尔运算，这个运算符会应用到某个当前时刻的每个时序数据上，如果一个时序数据的样本值与这个标量比较的结果是 `false`，则这个时序数据被丢弃掉，如果是 `true`, 则这个时序数据被保留在结果中。如果提供了 bool 修饰符，那么比较结果是 `0` 的时序数据被丢弃掉，而比较结果是 `1` 的时序数据被保留。例如：

```bash
http_requests_total > 100 # 结果为 true 或 false
http_requests_total > bool 100 # 结果为 1 或 0
```

瞬时向量与瞬时向量直接进行布尔运算时，同样遵循默认的匹配模式：依次找到与左边向量元素匹配（标签完全一致）的右边向量元素进行相应的操作，如果没找到匹配元素，或者计算结果为 false，则直接丢弃。如果匹配上了，则将左边向量的度量指标和标签的样本数据写入瞬时向量。如果提供了 bool 修饰符，那么比较结果是 `0` 的时序数据被丢弃掉，而比较结果是 `1` 的时序数据（只保留左边向量）被保留。

### 集合运算符

使用瞬时向量表达式能够获取到一个包含多个时间序列的集合，我们称为瞬时向量。 通过集合运算，可以在两个瞬时向量与瞬时向量之间进行相应的集合操作。目前，Prometheus 支持以下集合运算符：

+ `and` (并且)
+ `or` (或者)
+ `unless` (排除)

**vector1 and vector2** 会产生一个由 `vector1` 的元素组成的新的向量。该向量包含 vector1 中完全匹配 `vector2` 中的元素组成。

**vector1 or vector2** 会产生一个新的向量，该向量包含 `vector1` 中所有的样本数据，以及 `vector2` 中没有与 `vector1` 匹配到的样本数据。

**vector1 unless vector2** 会产生一个新的向量，新向量中的元素由 `vector1` 中没有与 `vector2` 匹配的元素组成。

## 匹配模式

向量与向量之间进行运算操作时会基于默认的匹配规则：依次找到与左边向量元素匹配（标签完全一致）的右边向量元素进行运算，如果没找到匹配元素，则直接丢弃。

接下来将介绍在 PromQL 中有两种典型的匹配模式：一对一（one-to-one）,多对一（many-to-one）或一对多（one-to-many）。

### 一对一匹配

一对一匹配模式会从操作符两边表达式获取的瞬时向量依次比较并找到唯一匹配(标签完全一致)的样本值。默认情况下，使用表达式：

```bash
vector1 <operator> vector2
```

在操作符两边表达式标签不一致的情况下，可以使用 `on(label list)` 或者 `ignoring(label list）`来修改便签的匹配行为。使用 `ignoreing` 可以在匹配时忽略某些便签。而 `on` 则用于将匹配行为限定在某些便签之内。

```bash
<vector expr> <bin-op> ignoring(<label list>) <vector expr>
<vector expr> <bin-op> on(<label list>) <vector expr>
```

例如当存在样本：

```bash
method_code:http_errors:rate5m{method="get", code="500"}  24
method_code:http_errors:rate5m{method="get", code="404"}  30
method_code:http_errors:rate5m{method="put", code="501"}  3
method_code:http_errors:rate5m{method="post", code="500"} 6
method_code:http_errors:rate5m{method="post", code="404"} 21

method:http_requests:rate5m{method="get"}  600
method:http_requests:rate5m{method="del"}  34
method:http_requests:rate5m{method="post"} 120
```

使用 PromQL 表达式：

```bash
method_code:http_errors:rate5m{code="500"} / ignoring(code) method:http_requests:rate5m
```

该表达式会返回在过去 5 分钟内，HTTP 请求状态码为 500 的在所有请求中的比例。如果没有使用 `ignoring(code)`，操作符两边表达式返回的瞬时向量中将找不到任何一个标签完全相同的匹配项。

因此结果如下：

```bash
{method="get"}  0.04            //  24 / 600
{method="post"} 0.05            //   6 / 120
```

同时由于 method 为 `put` 和 `del` 的样本找不到匹配项，因此不会出现在结果当中。

### 多对一和一对多

多对一和一对多两种匹配模式指的是“一”侧的每一个向量元素可以与"多"侧的多个元素匹配的情况。在这种情况下，必须使用 group 修饰符：`group_left` 或者 `group_right` 来确定哪一个向量具有更高的基数（充当“多”的角色）。

```bash
<vector expr> <bin-op> ignoring(<label list>) group_left(<label list>) <vector expr>
<vector expr> <bin-op> ignoring(<label list>) group_right(<label list>) <vector expr>
<vector expr> <bin-op> on(<label list>) group_left(<label list>) <vector expr>
<vector expr> <bin-op> on(<label list>) group_right(<label list>) <vector expr>
```

多对一和一对多两种模式一定是出现在操作符两侧表达式返回的向量标签不一致的情况。因此需要使用 ignoring 和 on 修饰符来排除或者限定匹配的标签列表。

例如，使用表达式：

```bash
method_code:http_errors:rate5m / ignoring(code) group_left method:http_requests:rate5m
```

该表达式中，左向量 `method_code:http_errors:rate5m` 包含两个标签 `method` 和 `code`。而右向量 `method:http_requests:rate5m` 中只包含一个标签 `method`，因此匹配时需要使用 `ignoring` 限定匹配的标签为 `code`。 在限定匹配标签后，右向量中的元素可能匹配到多个左向量中的元素 因此该表达式的匹配模式为多对一，需要使用 group 修饰符 `group_left` 指定左向量具有更好的基数。

最终的运算结果如下：

```bash
{method="get", code="500"}  0.04            //  24 / 600
{method="get", code="404"}  0.05            //  30 / 600
{method="post", code="500"} 0.05            //   6 / 120
{method="post", code="404"} 0.175           //  21 / 120
```

> 提醒：`group` 修饰符只能在比较和数学运算符中使用。在逻辑运算 `and`，`unless` 和 `or` 操作中默认与右向量中的所有元素进行匹配。

## 聚合操作

Prometheus 还提供了下列内置的聚合操作符，这些操作符作用域瞬时向量。可以将瞬时表达式返回的样本数据进行聚合，形成一个具有较少样本值的新的时间序列。

+ `sum` (求和)
+ `min` (最小值)
+ `max` (最大值)
+ `avg` (平均值)
+ `stddev` (标准差)
+ `stdvar` (标准差异)
+ `count` (计数)
+ `count_values` (对 value 进行计数)
+ `bottomk` (样本值最小的 k 个元素)
+ `topk` (样本值最大的k个元素)
+ `quantile` (分布统计)

这些操作符被用于聚合所有标签维度，或者通过 `without` 或者 `by` 子语句来保留不同的维度。

```bash
<aggr-op>([parameter,] <vector expression>) [without|by (<label list>)]
```

其中只有 `count_values`, `quantile`, `topk`, `bottomk` 支持参数(parameter)。

`without` 用于从计算结果中移除列举的标签，而保留其它标签。`by` 则正好相反，结果向量中只保留列出的标签，其余标签则移除。通过 without 和 by 可以按照样本的问题对数据进行聚合。

例如：

如果指标 `http_requests_total` 的时间序列的标签集为 `application`, `instance`, 和 `group`，我们可以通过以下方式计算所有 instance 中每个 application 和 group 的请求总量：

```bash
sum(http_requests_total) without (instance)
```

等价于

```bash
 sum(http_requests_total) by (application, group)
```

如果只需要计算整个应用的 HTTP 请求总量，可以直接使用表达式：

```bash
sum(http_requests_total)
```

`count_values` 用于时间序列中每一个样本值出现的次数。count_values 会为每一个唯一的样本值输出一个时间序列，并且每一个时间序列包含一个额外的标签。这个标签的名字由聚合参数指定，同时这个标签值是唯一的样本值。

例如要计算运行每个构建版本的二进制文件的数量：

```bash
count_values("version", build_version)
```

返回结果如下：

```bash
{count="641"}   1
{count="3226"}  2
{count="644"}   4
```

`topk` 和 `bottomk` 则用于对样本值进行排序，返回当前样本值前 n 位，或者后 n 位的时间序列。

获取 HTTP 请求数前 5 位的时序样本数据，可以使用表达式：

```bash
topk(5, http_requests_total)
```

`quantile` 用于计算当前样本数据值的分布情况 quantile(φ, express) ，其中 `0 ≤ φ ≤ 1`。

例如，当 φ 为 0.5 时，即表示找到当前样本数据中的中位数：

```bash
quantile(0.5, http_requests_total)
```

返回结果如下：

```bash
{}   656
```

## 二元运算符优先级

在 Prometheus 系统中，二元运算符优先级从高到低的顺序为：

1. `^`
2. `*`, `/`, `%`
3. `+`, `-`
4. `==`, `!=`, `<=`, `<`, `>=`, `>`
5. `and`, `unless`
6. `or`

具有相同优先级的运算符是满足结合律的（左结合）。例如，`2 * 3 % 2` 等价于 `(2 * 3) % 2`。运算符 `^` 例外，`^` 满足的是右结合，例如，`2 ^ 3 ^ 2` 等价于 `2 ^ (3 ^ 2)`。





