---
title: "Shadowshocks爬梯指南"
date: 2017-10-07T01:39:32+08:00
draft: false
tags : ["科学上网"]
categories : ["技术"]
toc : true
---

> 作为一个程序猿总是想去外面的世界自由探索,无奈天朝墙太高,让查资料，github等工作都变得很坑…
>
> 本文将介绍如何使用ShadowSocks进行翻墙.
>
> 按照以下步骤进行即可

## 1.安装 ss-qt5

ss-qt5是一个图形化的shadowshocks客户端,

安装之后选择 服务器=>打开服务器设定,

输入服务器信息即可.

Linux

```
sudo apt-get install ss-qt5
```
Mac

```
brew install ss-qt5
```

![](http://orfg3zirg.bkt.clouddn.com/201707281501253242-1.png)

## 2.安装chrome拓展
安装chrome拓展的目的是自由切换国内国外路线,只有国外走代理
- 打开chrome应用商店

- 下载 `SwitchyOmega`这个应用

- 选择`新建情景模式`

- 名称随意填写,类型选择`代理服务器`

- 然后代理协议选择`SOCKS5`,代理服务器和端口填上ss客户端的代理服务器和端口,我这里是`127.0.0.1` 和 `1080`

- 将`不代理的地址列表`中的内容清空

- 按照如下规则新建 

  <img src="http://orfg3zirg.bkt.clouddn.com/201707281501251292-p1.png" width="800px">

  规则列表地址为 
  `https://raw.githubusercontent.com/gfwlist/gfwlist/master/gfwlist.txt`
  到此为止,浏览器就可以愉快的翻墙了.
## 3.在终端里使用代理[可选]
安装`prioxy`

````
sudo apt-get install privoxy
````

修改prioxy的配置文件

```
gedit /etc/privoxy/config
```



注释掉原来的 `listen-address 127.0.0.1:8118`

在最后添加 
```
forward-socks5 / 127.0.0.1:1080 .
listen-address 127.0.0.1:8118
```

然后重启

```
sudo service privoxy restart
```



最后 在终端中使用代理
```
export http_proxy="127.0.0.1:8118"
export https_proxy="127.0.0.1:8118"
```

## enjoy it :)