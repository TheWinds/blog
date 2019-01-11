---
title: "MacOS系统Docker默认存储路径迁移方法"
date: 2019-01-11T18:02:42+08:00
draft: true
tags : ["docker","macos"]
categories : ["技术"]
toc : true
---

MacOS系统Docker默认存储路径迁移方法
===
> 对于仅有120G的固态硬盘来说，Docker占用的存储空间感到压力山大。搜了一圈才找到迁移修改默认存储位置的方法，特此记录一下。


## 先说修改方法
Docker MacOS版本默认的存储路径是
```
~/Library/Containers/com.docker.docker/
```
思路就是先把这个文件夹移动到其他（你的其他硬盘或分区）位置，然后再将新位置创建一个软链接到这里来。
 
第一步将docker文件夹复制到新位置，因为socket文件是不允许直接复制的，所以可以用rsync来进行同步实现复制
```
rsync -a ~/Library/Containers/com.docker.docker/ /Volumes/xxxx 
```

第二步将原来的docker文件夹重命名为 `com.docker.docker.old`
```
mv com.docker.docker com.docker.docker.old
```

第三步将新路径软链接过来
```
# cd ~/Library/Containers
ln -s /Volumes/xxxx com.docker.docker
```

第四部启动docker，如果正常启动删除掉原来的docker文件夹即可
```
rm com.docker.docker.old
```

## EOF