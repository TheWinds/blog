---
title: "HTMLEntities转换为汉字"
date: 2017-11-06T18:20:49+08:00
draft: true
tags : []
categories : []
toc : true
---
> 上周在做MVC作业的时候需要去当当爬一些数据,了解到C#中有通过JQuery解析Html的库CSQuery,就用了试了一下。结果在查看Element的InnerText的时候出现了一些让人匪夷所思的东西 = =|，查了一下这个东西原来叫做HTML Entities

# 什么是HTML Entities
> Some characters are reserved in HTML and they have special meaning when used in HTML document. For example, you cannot use the greater than and less than signs or angle brackets within your HTML text because the browser will treat them differently and will try to draw a meaning related to HTML tag.HTML processors must support following five special characters listed in the table that follows.

也就是一些无法直接表示的特殊字符被转义后的字符。
比如 `"` 变为 `&quot;`,`>` 变为 `&gt;` .... [更多例子](http://www.tutorialspoint.com/html/html_entities.htm)

这一次遇到的问题就是被转义的汉字。
遇到的汉字是这种形式: 

```
&#
```
