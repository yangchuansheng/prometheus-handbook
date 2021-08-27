Grafana支持查询Prometheus。从Grafana 2.5.0（2015-10-28）开始包含Prometheus的Grafana数据源。

下面显示了一个示例Grafana仪表板，该仪表板查询Prometheus以获取数据：
![](https://prometheus.io/assets/grafana_prometheus.png)
##正在安装
要安装Grafana，请参阅Grafana官方文档(https://grafana.com/grafana/download/)。

##使用
默认情况下，Grafana将在 http//localhost3000 上监听 。默认登录名是“admin”/“admin”。

###创建Prometheus数据源
要创建Prometheus数据源：

1.单击Grafana徽标以打开侧边栏菜单。  
2.单击边栏中的“数据源”。  
3.点击“添加新”。  
4.选择“ Prometheus”作为类型。  
5.设置适当的Prometheus服务器网址（例如，http://localhost:9090/）。  
6.根据需要调整其他数据源设置（例如，关闭代理访问）。  
7.单击“添加”以保存新的数据源。

以下显示了示例数据源配置：
![](https://prometheus.io/assets/grafana_configuring_datasource.png)
###创建一个普罗米修斯图
遵循添加新Grafana图的标准方法。然后：

1.单击图形标题，然后单击“编辑”。  
2.在“指标”选项卡下，选择Prometheus数据源（右下方）。  
3.在“查询”字段中输入任何Prometheus表达式，同时使用“指标”字段通过自动补全查找指标。  
4.要格式化时间序列的图例名称，请使用“图例格式”输入。例如，要仅显示返回的查询结果的method和status标签，并用破折号分隔，可以使用图例格式字符串 {{method}} - {{status}}。  
5.调整其他图形设置，直到可以使用图形为止。   

下面显示了Prometheus图配置示例：
![](https://prometheus.io/assets/grafana_qps_graph.png)
###从Grafana.com导入预构建的仪表板
Grafana.com维护着[一组共享仪表板](https://grafana.com/dashboards) ，这些[仪表板](https://grafana.com/dashboards)可以下载并与Grafana的独立实例一起使用。使用Grafana.com的“过滤器”选项仅浏览仪表板中的“ Prometheus”数据源。

当前，您必须当前手动编辑下载的JSON文件并更正 datasource:条目，以反映为Prometheus服务器选择的Grafana数据源名称。使用“仪表板”→“主页”→“导入”选项将已编辑的仪表板文件导入到您的Grafana安装中。

