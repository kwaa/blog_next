---
title: NixOS 安装与配置（三）：程序配置
tags:
  - NixOS
published: 2024-07-01
---

之前安装了一些程序，是时候配置它们了。

示例继承上一节的目录结构。

## 目录

1. [硬盘分区](./nixos-disko.md)
2. [系统配置](./nixos-configuration.md)
3. 程序配置 (you are here)

## VSCode

完整的 VSCode 配置会很复杂，这里我只配置它作为 [Nix IDE](https://github.com/nix-community/vscode-nix-ide) 的部分。

### 安装

启用 VSCode 模块，并禁用更新检测：

```nix
# home-manager/vscode.nix
{
  programs.vscode = {
    enable = true;
    enableUpdateCheck = false;
  };
}
```

```diff
# home-manager/home.nix
{
  imports = [
    # If you want to use home-manager modules from other flakes (such as nix-colors):
    # inputs.nix-colors.homeManagerModule
    inputs.impermanence.nixosModules.home-manager.impermanence

    # You can also split up your configuration and import pieces of it here:
    # ./nvim.nix
    ./impermanence.nix
+   ./vscode.nix
  ];
}
```

### 配置

### 主题

### 插件

## Librewolf (Firefox)

## GNOME

[发现 Determinate Systems 已经写过了](https://determinate.systems/posts/declarative-gnome-configuration-with-nixos/)，我暂且先偷懒放个链接（以后可能会补）
