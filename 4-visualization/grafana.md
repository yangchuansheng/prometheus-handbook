#控制台模板
控制台模板允许使用[Go模板语言](https://golang.org/pkg/text/template/)创建任意控制台。这些是从Prometheus服务器提供的。

控制台模板是创建可在源代码管理中轻松管理的模板的最强大方法。不过，这是一条学习曲线，因此刚接触这种监视方式的用户应首先尝试使用 Grafana。

## 入门
Prometheus附带了一组示例控制台，助您一臂之力。这些可以在/consoles/index.html.example正在运行的Prometheus上找到，如果Prometheus用job="node"标签刮掉Node Exporters，它们将显示Node Exporter控制台 。

示例控制台包含5个部分：

1.顶部的导航栏  
2.左侧菜单  
3.底部的时间控制 
4.中心的主要内容，通常是图形  
5.右边的桌子   

导航栏用于链接到其他系统，例如其他Prometheis 1，文档以及对您有意义的任何其他内容。该菜单用于在同一Prometheus服务器中进行导航，这对于能够快速打开另一个选项卡中的控制台以关联信息非常有用。两者都在中配置 console_libraries/menu.lib。

时间控件允许更改图表的持续时间和范围。控制台URL可以共享，其他URL将显示相同的图形。

主要内容通常是图形。提供了一个可配置的JavaScript图形库，该库将处理来自Prometheus的请求数据，并通过[Rickshaw](https://shutterstock.github.io/rickshaw/)进行呈现。

最后，可以使用右侧的表格以比图表更紧凑的形式显示统计信息。

##控制台示例
这是一个基本的控制台。它在右侧表中显示了任务数，任务数，平均CPU使用率和平均内存使用率。主要内容具有“每秒查询数”图。

```
{{template "head" .}}

{{template "prom_right_table_head"}}
<tr>
  <th>MyJob</th>
  <th>{{ template "prom_query_drilldown" (args "sum(up{job='myjob'})") }}
      / {{ template "prom_query_drilldown" (args "count(up{job='myjob'})") }}
  </th>
</tr>
<tr>
  <td>CPU</td>
  <td>{{ template "prom_query_drilldown" (args
      "avg by(job)(rate(process_cpu_seconds_total{job='myjob'}[5m]))"
      "s/s" "humanizeNoSmallPrefix") }}
  </td>
</tr>
<tr>
  <td>Memory</td>
  <td>{{ template "prom_query_drilldown" (args
       "avg by(job)(process_resident_memory_bytes{job='myjob'})"
       "B" "humanize1024") }}
  </td>
</tr>
{{template "prom_right_table_tail"}}


{{template "prom_content_head" .}}
<h1>MyJob</h1>

<h3>Queries</h3>
<div id="queryGraph"></div>
<script>
new PromConsole.Graph({
  node: document.querySelector("#queryGraph"),
  expr: "sum(rate(http_query_count{job='myjob'}[5m]))",
  name: "Queries",
  yAxisFormatter: PromConsole.NumberFormatter.humanizeNoSmallPrefix,
  yHoverFormatter: PromConsole.NumberFormatter.humanizeNoSmallPrefix,
  yUnits: "/s",
  yTitle: "Queries"
})
</script>

{{template "prom_content_tail" .}}

{{template "tail"}}
```

在prom_right_table_head与prom_right_table_tail模板包含右手边桌。这是可选的。

prom_query_drilldown是一个模板，它将评估传递给它的表达式，对其进行格式化并在[表达式浏览器](browser.md)中链接到该表达式。第一个参数是表达式。第二个参数是要使用的单位。第三个参数是如何格式化输出。仅第一个参数是必需的。

第三个参数的有效输出格式prom_query_drilldown：

+ 未指定：默认Go显示输出。
+ humanize：使用度量标准前缀显示结果。
+ humanizeNoSmallPrefix：对于大于1的绝对值，请使用度量前缀显示结果。对于小于1的绝对值，请显示3个有效数字。这对于避免可能由每秒产生的单位（例如每秒的单位）很有用 humanize。
+ humanize1024：使用1024（而不是1000）的底数显示人性化的结果。通常将其与B第二个参数一起使用，以产生诸如KiB和的单位MiB。
+ printf.3g：显示3位有效数字。
可以定义自定义格式。有关示例，请参见 [prom.lib](https://github.com/prometheus/prometheus/blob/master/console_libraries/prom.lib)。

##图库
图形库的调用方式为：
```
<div id="queryGraph"></div>
<script>
new PromConsole.Graph({
  node: document.querySelector("#queryGraph"),
  expr: "sum(rate(http_query_count{job='myjob'}[5m]))"
})
</script>
```
该head模板将加载所需的Javascript和CSS。

图形库的参数：

 | 名称 | 描述 |
  -----|-----
| expr	| 需要。要表达的图形。可以是列表。|
| node	| 需要。要渲染到的DOM节点。|
| duration | 可选的。图的持续时间。默认为1小时。|
| endTime | 可选的。Unixtime，图形结束于。默认为现在。|
| width	|可选的。图的宽度，不包括标题。默认为自动检测。|
|height	|可选的。图形的高度，不包括标题和图例。默认为200像素。|
|min	|可选的。最小x轴值。默认为最低数据值。|
|max|	可选的。y轴最大值。默认为最高数据值。|
|renderer	|可选的。图的类型。选项是line和area（堆叠图）。默认为line。|
|name	|可选的。图例标题中的图例和悬停详细信息。如果传递了字符串，[[ label ]]则将替换为标签值。如果传递了一个函数，它将传递一个标签映射，并且应将名称作为字符串返回。可以是列表。
|xTitle	|可选的。x轴的标题。默认为Time。|
|yUnits	|可选的。y轴的单位。默认为空。|
|yTitle	|可选的。y轴的标题。默认为空。|
|yAxisFormatter|	可选的。y轴的数字格式器。默认为PromConsole.NumberFormatter.humanize。|
|yHoverFormatter|	可选的。悬停详细信息的数字格式化程序。默认为PromConsole.NumberFormatter.humanizeExact。|
|colorScheme|	可选的。绘图要使用的[配色方案](https://github.com/shutterstock/rickshaw/blob/master/src/js/Rickshaw.Fixtures.Color.js)。可以是十六进制颜色代码的列表，也可以是Rickshaw支持的颜色方案名称之一。默认为'colorwheel'。|

如果expr和name均为列表，则它们的长度必须相同。该名称将应用于对应表达式的图。

为有效选项yAxisFormatter和yHoverFormatter：

+ PromConsole.NumberFormatter.humanize：使用度量标准前缀格式化。
+ PromConsole.NumberFormatter.humanizeNoSmallPrefix：对于大于1的绝对值，请使用度量标准前缀格式化。对于绝对值小于1的格式，请使用3个有效数字。这对于避免可能由每秒产生的单位（例如每秒的单位）很有用 PromConsole.NumberFormatter.humanize。
+ PromConsole.NumberFormatter.humanize1024：使用1024（而不是1000）的底数来格式化人性化的结果。