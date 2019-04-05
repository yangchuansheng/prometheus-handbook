# 安装

## 使用预编译二进制文件

我们为绝大部分 Prometheus 组件提供预编译二进制文件。查看[下载](https://prometheus.io/download)获取所有可用版本列表。

## 从源代码构建

要从源代码构建 Prometheus 组件，请查看相应仓库中的 `Makefile`。

## 使用Docker

所有可用的 Prometheus 容器镜像可在公有镜像仓库 [Quay.io](https://quay.io/repository/prometheus/prometheus) 或者 [Docker Hub](https://hub.docker.com/u/prom/) 中获取。

使用 Docker 运行 Prometheus 相当简单，只需要命名 `docker run -p 9090:9090 prom/prometheus`，Prometheus 将使用一个简单的配置文件启动并暴露服务到9090端口。

Prometheus 容器镜像使用卷来存储实际的 metrics 指标。对于生产部署，强烈推荐使用 [容器数据卷](https://docs.docker.com/engine/admin/volumes/volumes/) 来简化 Prometheus 升级时的数据管理操作。

* 绑定及挂载数据卷

用以下命令将主机文件系统中的 `prometheus.yml` 挂载到容器中：

```bash
docker run -p 9090:9090 -v /tmp/prometheus.yml:/etc/prometheus/prometheus.yml \
       prom/prometheus
```

或者使用额外的数据卷挂载配置文件：

```bash
docker run -p 9090:9090 -v /prometheus-data \
       prom/prometheus --config.file=/prometheus-data/prometheus.yml
```

* 自定义容器镜像

为了避免挂载主机文件到容器中的操作，可以将配置文件封装入容器镜像中。此方法适用于配置文件基本稳定（变更小）并且在所有环境中都相同的情况。

创建一个新的路径来存放 Prometheus 配置文件， Dockerfile 如下：

```yaml
FROM prom/prometheus
ADD prometheus.yml /etc/prometheus/
```

执行以下命令构建新镜像，并运行容器：

```bash
docker build -t my-prometheus .
docker run -p 9090:9090 my-prometheus
```

更高级的选项是在容器启动时，使用某些动态配置管理工具或者守护程序定期更新配置。

## 使用配置管理系统

如果你更喜欢使用配置管理系统，你可能会对以下几种第三方工具感兴趣：

**Ansible** 
* [Cloud Alchemy/ansible-prometheus](https://github.com/cloudalchemy/ansible-prometheus)

**Chef** 
* [rayrod2030/chef-prometheus](https://github.com/rayrod2030/chef-prometheus)

**Puppet** 
* [puppet/prometheus](https://forge.puppet.com/puppet/prometheus)

**SaltStack**
* [bechtoldt/saltstack-prometheus-formula](https://github.com/bechtoldt/saltstack-prometheus-formula)



