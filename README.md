# Prometheus 中文文档

随着容器技术的迅速发展，Kubernetes 已然成为大家追捧的容器集群管理系统。[Prometheus](https://prometheus.io) 作为生态圈 Cloud Native Computing Foundation（简称：CNCF）中的重要一员,其活跃度仅次于 Kubernetes, 现已广泛用于 Kubernetes 集群的监控系统中。

本文是 Prometheus 官方文档的中文版，同时包括了本人平时在使用 Prometheus 时的参考指南和实践总结，形成一个系统化的参考指南以方便查阅。欢迎大家关注和添加完善内容。

官方文档地址：[https://prometheus.io/docs/introduction/overview/](https://prometheus.io/docs/introduction/overview/)

## 在线阅读

+ Gitbook : [https://www.yangcs.net/prometheus/](https://www.yangcs.net/prometheus/)
+ Gitbook 新版 : [https://ryanyang.gitbook.io/prometheus/](https://ryanyang.gitbook.io/prometheus/)

## 项目源码

项目源码存放于 Github 上，[https://github.com/yangchuansheng/prometheus-handbook](https://github.com/yangchuansheng/prometheus-handbook)。

### 本书版本更新记录

如无特殊说明，本指南所有文档仅适用于 Prometheus v2.6 及以上版本。

## 特殊语法

如果想标注出需要读者特别注意的地方，可以使用以下语法：

```bash
> **[info] 注意**
>
> 冒号用来表示用户自定义的记录规则，不能在 exporter 中或监控对象直接暴露的指标中使用冒号来定义指标名称。
```

显示如下：

![](https://hugo-picture.oss-cn-beijing.aliyuncs.com/blog/2019-06-01-104423.jpg)

## 微信公众号

扫码关注微信公众号，坐上云原生的早班车。

![](https://hugo-picture.oss-cn-beijing.aliyuncs.com/blog/2019-06-01-%E5%85%AC%E4%BC%97%E5%8F%B7%E4%BA%8C%E7%BB%B4%E7%A0%81.png)

## 贡献者

欢迎参与贡献和完善内容，贡献方法参考 [CONTRIBUTING](https://github.com/yangchuansheng/prometheus-handbook/blob/master/CONTRIBUTING.md)。感谢所有的贡献者，贡献者列表见 [contributors](https://github.com/yangchuansheng/prometheus-handbook/graphs/contributors)。
