---
title: "DroneCI+Github入坑指北"
date: 2019-10-04T17:36:51+08:00
draft: false
tags : ["技术","Drone","CI","docker"]
categories : ["技术"]
toc : true
---

# DroneCI+Github入坑指北

## 简介

> Automate Software Testing and Delivery
> Drone is a self-service Continuous Delivery platform for busy development teams.

Drone是一个为繁忙的开发团队提供的自助式连续交付平台。

除了Drone目前做的比较成熟的还有Gitlab-CI、Jenkins、最近新推出的Github-Actions等。因为Drone占用的资源比较少，并且喜欢它的容器即插件的理念，~~(是我大Golang写的)~~所以选择用它来体验一下CI。

！但是不得不吐槽的是Drone的文档做的很烂。。所以希望这篇文章能让你少走弯路😇

本文用的是Drone最新版本，不是网上很多1.0之前的版本，根据这个教程走下去应该不会有什么问题。


## 配置

整个CI流程需要通过 `git hook`来触发，Drone支持Github、GitLab、Gitea、Gogs、Bitbucket Cloud、Bitbucket Server几种SCM(source control management)，期初我是使用gogs来搭建的，由于https证书问题产生的x509错误最终放弃了gogs方案，最终使用的是github+drone。

###  Github相关配置

Drone和Github交互需要通过OAuth进行鉴权，所以要先申请一个OAuth应用。

打开`github.com`点击头像，选择`Settings / Developer settings / OAuth Apps`，然后点击`New OAuth App`创建OAuth应用。

**其中`http://cici.xxxx.com`是你部署Drone的域名，注意callback url 不要填错。**

![urigiT.png](https://s2.ax1x.com/2019/10/04/urigiT.png)

然后注册应用，记录下其中的`ClientID`和`ClientSecret`下面要用到

![urFN01.png](https://s2.ax1x.com/2019/10/04/urFN01.png)

### docker-compose相关配置

我这里是通过docker的方式安装的，docker-compose编排。

安装Drone需要一个`drone-server`和`drone-runner`，

> drone-runner不是必选的，官方不推荐吧runner和server安装在一个实例上，如果你安装到一个实例上的话可以设置DRONE_AGENTS_ENABLED=false，drone-server将会作为默认的runner，我这为了演示，runner和server是在一个同服务器上的。

docker-compose.yml 文件:

```yaml
version: '2'

services:
  drone-server:
    image: drone/drone:latest
    container_name: drone-server
    networks: 
      - dronenet        # 让drone-server和drone-agent处于一个网络中，方便进行RPC通信
    ports:
      - '10081:80'      # Web管理面板的入口 PROTO=http  时使用该端口
      - '10082:443'     # Web管理面板的入口 PROTO=https 时使用该端口
      - '10083:9000'    # RPC服务端口
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock   # docker.sock [1]
      - /var/data/drone/:/var/lib/drone             # drone数据存放路径
    environment:
      - DRONE_AGENTS_ENABLED=true                   # 使用Runner
      - DRONE_GITHUB_SERVER=https://github.com                    # github的地址
      - DRONE_GITHUB_CLIENT_ID=${DRONE_GITHUB_CLIENT_ID}          # 上一步获得的ClientID
      - DRONE_GITHUB_CLIENT_SECRET=${DRONE_GITHUB_CLIENT_SECRET}  # 上一步获得的ClientSecret
      - DRONE_RPC_SECRET=${DRONE_RPC_SECRET}                      # RPC秘钥	[2]
      - DRONE_SERVER_HOST=${DRONE_SERVER_HOST}                    # RPC域名(在一个实例上可以不用)
      - DRONE_SERVER_PROTO=${DRONE_SERVER_PROTO}                  # git webhook使用的协议(我建议http)
      - DRONE_OPEN=true                                           # 开发drone
      - DRONE_DATABASE_DATASOURCE=/var/lib/drone/drone.sqlite     # 数据库文件
      - DRONE_DATABASE_DRIVER=sqlite3                             # 数据库驱动，我这里选的sqlite
      - DRONE_DEBUG=true                                          # 调试相关，部署的时候建议先打开
      - DRONE_LOGS_DEBUG=true                                     # 调试相关，部署的时候建议先打开
      - DRONE_LOGS_TRACE=true                                     # 调试相关，部署的时候建议先打开
      - DRONE_USER_CREATE=username:TheWinds，admin:true           # 初始管理员用户
      - TZ=Asia/Shanghai                                          # 时区
    restart: always
  drone-agent:
    image: drone/agent:latest
    container_name: drone-agent
    networks: 
      - dronenet     # 让drone-server和drone-agent处于一个网络中，方便进行RPC通信
    depends_on:
      - drone-server 
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock # docker.sock [1]
    environment:
      - DRONE_RPC_SERVER=http://drone-server  # RPC服务地址
      - DRONE_RPC_SECRET=${DRONE_RPC_SECRET}  # RPC秘钥
      - DRONE_RPC_PROTO=${DRONE_RPC_PROTO}    # RPC协议(http || https)
      - DRONE_RUNNER_CAPACITY=2               # 最大并发执行的 pipeline 数
      - DRONE_DEBUG=true                      # 调试相关，部署的时候建议先打开
      - DRONE_LOGS_DEBUG=true                 # 调试相关，部署的时候建议先打开
      - DRONE_LOGS_TRACE=true                 # 调试相关，部署的时候建议先打开
      - TZ=Asia/Shanghai
    restart: always
networks:
  dronenet:					# 让drone-server和drone-agent处于一个网络中，方便进行RPC通信
```

- **[1]** 因为插件本身也是一个容器，要在容器中(docker-server、drone-runnere)中运行容器。将docker.sock挂载到容器中，可以让容器通过docker unix socket API得到管理容器的能力。
- **[2]** 你可以通过 ``` openssl rand -hex 16``` 这个命令随机生成秘钥

.env文件:

```
DRONE_GITHUB_CLIENT_ID=your_github_client_id
DRONE_GITHUB_CLIENT_SECRET=your_github_client_secret 
DRONE_RPC_SECRET=your_rpc_secret
DRONE_SERVER_HOST=cici.xxxx.com
DRONE_SERVER_PROTO=http
DRONE_RPC_SERVER=rpc.cici.xxxx.com
DRONE_RPC_PROTO=http
```

## 启动

将`docker-compose.yml`和`.env`文件上传至服务器同一目录，然后执行

```sh
docker-compose up -d
```

启动服务，一起顺利的话打开你的域名你将会看到

OAuth的授权页面，进行授权之后就可以看到管理面板了 💜

![urmY80.png](https://s2.ax1x.com/2019/10/04/urmY80.png)

## 使用

基本使用基本上参考https://docs.drone.io/上面的文档就可以了，没什么好说的，下面我主要想说一下Secret管理和私有仓库的使用方法。

###Secret管理 

CI工作流编排是写在仓库中的`.drone.yml`中的，如果我们想进行一些私有的操作(比如ssh_key，用于通知的账号密码…)就要把这些敏感信息写在yml里，而这些私有信息的暴露肯定是不允许发生的。所以这些秘密信息一般在构建过程中由CI工具**注入到环境变量**中的。

drone支持多种secret管理方式，最基本和最方便的方式就是直接通过Web后台进行管理。

打开`Repositories/your_repo_name/settings` 找到Secrets选项卡，输入Secret Name和Secret Value就可以添加Name=>Value的秘钥键值对了，这些秘钥将在构建过程中被注入。

下面就来试一下



1. Github创建项目 **drone_test_pub**

```
.
├── .drone.yml
└── main.go
```



- main.go

```go
package main

import (
	"fmt"
	"os"
	"strings"
)

func main() {
	aSecret := os.Getenv("A_SECRET")
	fmt.Println(aSecret)
	fmt.Println(reverseString(aSecret))
}

func reverseString(s string) string {
	r := []rune(s)
	sb := strings.Builder{}
	for i := len(r) - 1; i >= 0; i-- {
		sb.WriteRune(r[i])
	}
	return sb.String()
}
```



- .drone.yml

```yaml
---
kind: pipeline
type: docker
name: default

steps:
- name: build
  image: golang
  environment:
    A_SECRET:
      from_secret: a_secret
  commands:
  - echo $$A_SECRET
  - go run . > test_secret.txt
  - cat test_secret.txt
```



2. Drone管理面板，激活仓库drone_test_pub 并创建一个仓库级别的Secret `a_secret = terces elbakaepsnu`

[![ur8ZPe.md.png](https://s2.ax1x.com/2019/10/04/ur8ZPe.md.png)](https://imgchr.com/i/ur8ZPe)

3. 推送代码到Github查看构建情况

```sh
▶ git commit --allow-empty
[master 0460b0d] test push

▶ git push
Enumerating objects: 1， done.
Counting objects: 100% (1/1)， done.
Writing objects: 100% (1/1)， 179 bytes | 179.00 KiB/s， done.
Total 1 (delta 0)， reused 0 (delta 0)
To github.com:TheWinds/drone_test_pub.git
   0ccca9b..0460b0d  master -> master
```

4.构建结果

从活动流里可以看到，已经成功进行了克隆和构建，首先是进行了默认的clone步骤，然后进行的build步骤。

从build的执行结果来看，我们 `echo $A_SECRET`的时候得到的是一个掩码`********`，然后在main.go将 $A_SECRET进行反转后得到了`unspeakable secret`说明已经成功得到了注入的Secret。

通过查看Drone-Runtime的源码可以看到，运行的时候对于要显示在控制台的内容，都会把Secret Value 加入到string replacer中，统一被替换为掩码`********`。~~然而这并没有什么卵用，通过字符串操作就能使其输出未进行掩码的Secret，然后就能进行还原了。。~~



[![urGPzj.md.png](https://s2.ax1x.com/2019/10/04/urGPzj.md.png)](https://imgchr.com/i/urGPzj)



[![urGALq.md.png](https://s2.ax1x.com/2019/10/04/urGALq.md.png)](https://imgchr.com/i/urGALq)

### 克隆私有仓库

Drone默认会有一个Clone的步骤，要克隆私有仓库要把这个步骤关闭。

然后把Github该仓库的 `deploy_key`对应的**私钥**设为Secret注入到 SSH_KEY 环境变量中。

接下来创建一个clone的步骤，我这里使用的是alpine/git的镜像，通过`echo "$$SSH_KEY" > /root/.ssh/id_rsa`吧私钥写入到id_rsa中，git clone 填写你的私有仓库ssh地址就可以进行克隆了。

> deploy_key相比github的全局sshkey，可以控制到仅克隆仓库的权限，适合进行部署操作，具体怎么去设置我就不再赘述了
>
> 生成一对sshkey可以用 `ssh-keygen -t rsa -b 4096 -C "your_email"` 这个命令

- .drone.yml

```yaml
---
kind: pipeline
type: docker
name: default

clone:
  disable: true
steps:
- name: clone
  image: alpine/git
  environment:
    SSH_KEY:
      from_secret: ssh_key
  commands:
    - mkdir -p /root/.ssh/
    - echo "$$SSH_KEY" > /root/.ssh/id_rsa
    - chmod -R 600 /root/.ssh/
    - ssh-keyscan -t rsa github.com >> ~/.ssh/known_hosts
    - git clone -v git@github.com:TheWinds/drone_test.git .
- name: build
  image: golang
  commands:
  - go run . > hello.txt
  - cat hello.txt
```

## 结语

DroneCI断断续续搞了将近一周的时间，期间因为文档不清楚找不到问题还放弃了几次🙃。但是都开始了，就很难放弃，查了很多资料看了一下源码后终于整好了。

祝你好运。