# Prometheus 简介

## 什么是 Prometheus？

[Prometheus](https://github.com/prometheus) 是由前 Google 工程师从 2012 年开始在 [Soundcloud](http://soundcloud.com/) 以开源软件的形式进行研发的系统监控和告警工具包，自此以后，许多公司和组织都采用了 Prometheus 作为监控告警工具。Prometheus 的开发者和用户社区非常活跃，它现在是一个独立的开源项目，可以独立于任何公司进行维护。为了证明这一点，Prometheus 于 2016 年 5 月加入 [CNCF](https://cncf.io/) 基金会，成为继 [Kubernetes](http://kubernetes.io/) 之后的第二个 CNCF 托管项目。

有关 Prometheus 的详细信息，请参考[后续章节](media.html)

### Prometheus 的优势

Prometheus 的主要优势有：

+ 由指标名称和和键/值对标签标识的时间序列数据组成的多维[数据模型](../2-concepts/data_model.html)。
+ 强大的[查询语言 PromQL](../4-prometheus/basics.html)。
+ 不依赖分布式存储；单个服务节点具有自治能力。
+ 时间序列数据是服务端通过 HTTP 协议主动拉取获得的。
+ 也可以通过中间网关来[推送时间序列数据](../5-instrumenting/pushing.html)。
+ 可以通过静态配置文件或服务发现来获取监控目标。
+ 支持多种类型的图表和仪表盘。

### Prometheus 的组件

Prometheus 生态系统由多个组件组成，其中有许多组件是可选的：

+ [Prometheus Server](https://github.com/prometheus/prometheus) 作为服务端，用来存储时间序列数据。
+ [客户端库](../5-instrumenting/clientlibs.html)用来检测应用程序代码。
+ 用于支持临时任务的[推送网关](https://github.com/prometheus/pushgateway)。
+ [Exporter](../5-instrumenting/exporters.html) 用来监控 HAProxy，StatsD，Graphite 等特殊的监控目标，并向 Prometheus 提供标准格式的监控样本数据。
+ [alartmanager](https://github.com/prometheus/alertmanager) 用来处理告警。
+ 其他各种周边工具。

其中大多数组件都是用 [Go](https://golang.org/) 编写的，因此很容易构建和部署为静态二进制文件。

### Prometheus 的架构

Prometheus 的整体架构以及生态系统组件如下图所示：

![](https://hugo-picture.oss-cn-beijing.aliyuncs.com/images/9Qt5yi.jpg)

Prometheus Server 直接从监控目标中或者间接通过推送网关来拉取监控指标，它在本地存储所有抓取到的样本数据，并对此数据执行一系列规则，以汇总和记录现有数据的新时间序列或生成告警。可以通过 [Grafana](https://grafana.com/) 或者其他工具来实现监控数据的可视化。

## Prometheus 适用于什么场景

Prometheus 适用于记录文本格式的时间序列，它既适用于以机器为中心的监控，也适用于高度动态的面向服务架构的监控。在微服务的世界中，它对多维数据收集和查询的支持有特殊优势。Prometheus 是专为提高系统可靠性而设计的，它可以在断电期间快速诊断问题，每个 Prometheus Server 都是相互独立的，不依赖于网络存储或其他远程服务。当基础架构出现故障时，你可以通过 Prometheus 快速定位故障点，而且不会消耗大量的基础架构资源。

## Prometheus 不适合什么场景

Prometheus 非常重视可靠性，即使在出现故障的情况下，你也可以随时查看有关系统的可用统计信息。如果你需要百分之百的准确度，例如按请求数量计费，那么 Prometheus 不太适合你，因为它收集的数据可能不够详细完整。这种情况下，你最好使用其他系统来收集和分析数据以进行计费，并使用 Prometheus 来监控系统的其余部分。