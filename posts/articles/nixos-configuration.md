---
title: NixOS 安装与配置（二）：基础配置
tags:
  - NixOS
published: 2024-06-30
---

时隔许久的第二篇，由于我的 NixOS 配置已经改了很多，这里会从头开始讲——主要是思路，不一定和我当前配置一致。

此时已经分区完毕，是时候配置并安装系统了。

## 目录

1. [使用 Disko 对硬盘进行声明式分区](./nixos-disko.md)
2. 基础配置 (you are here)

## 配置

### 下载模板

我使用 `Misterio77/nix-starter-configs` 中的 `minimal` 模板。

```bash
sudo mkdir -p /mnt/etc/nixos
cd /mnt/etc/nixos
sudo nix --experimental-features "nix-command flakes" flake init -t github:misterio77/nix-starter-config#minimal
```

### 生成默认配置

```bash
# 生成默认配置
sudo nixos-generate-config --no-filesystems --root /mnt
# 将默认配置移动到 /mnt/etc/nixos/nixos
sudo mv configuration.nix /mnt/etc/nixos/nixos
sudo mv hardware-configuration.nix /mnt/etc/nixos/nixos
```

### 使用 unstable

作为滚动发行版爱好者，连 Debian 都要用 Sid 的人，NixOS Stable 我是完全用不下去的。

Misterio77 的模板还在使用 NixOS 23.11（甚至不是 24.05，可能忘了更新），这里把它改为 Unstable。

```diff
# flake.nix
{
  inputs = {
-   # Nixpkgs
-   nixpkgs.url = "github:nixos/nixpkgs/nixos-23.11";
+   nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";

-   # Home manager
-   home-manager.url = "github:nix-community/home-manager/release-23.11";
+   home-manager.url = "github:nix-community/home-manager";
    home-manager.inputs.nixpkgs.follows = "nixpkgs";
  };
}
```

### 配置 disko

移动之前用来创建分区的 disko 配置，并在 `flake.nix` 和 `nixos/configuration.nix` 添加导入。

```bash
# 将 disko 配置移动到 /mnt/etc/nixos/nixos/disko.nix
sudo mv /tmp/disko.nix /mnt/etc/nixos/nixos
```

```diff
# flake.nix
{
  inputs = {
    # Nixpkgs
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";

    home-manager.url = "github:nix-community/home-manager";
    home-manager.inputs.nixpkgs.follows = "nixpkgs";

+   disko.url = "github:nix-community/disko";
+   disko.inputs.nixpkgs.follows = "nixpkgs";
  };
}
```

```diff
# nixos/configuration.nix
{ inputs, ... }: {
  imports = [
+   inputs.disko.nixosModules.disko
    # If you want to use modules from other flakes (such as nixos-hardware):
    # inputs.hardware.nixosModules.common-cpu-amd
    # inputs.hardware.nixosModules.common-ssd

    # You can also split up your configuration and import pieces of it here:
    # ./users.nix

    # Import your generated (nixos-generate-config) hardware configuration
    ./hardware-configuration.nix
+   ./disko.nix
  ];
}
```

### 配置 impermanence

这部分复杂一点，首先从 README 搬一个基础配置：

> TODO

最后添加导入：

```diff
# flake.nix
{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";

    home-manager.url = "github:nix-community/home-manager";
    home-manager.inputs.nixpkgs.follows = "nixpkgs";

    disko.url = "github:nix-community/disko";
    disko.inputs.nixpkgs.follows = "nixpkgs";

+   impermanence.url = "github:nix-community/impermanence";
  };
}
```

```diff
# nixos/configuration.nix
{ inputs, ... }: {
  imports = [
    inputs.disko.nixosModules.disko
+   impermanence.nixosModules.impermanence
    # If you want to use modules from other flakes (such as nixos-hardware):
    # inputs.hardware.nixosModules.common-cpu-amd
    # inputs.hardware.nixosModules.common-ssd

    # You can also split up your configuration and import pieces of it here:
    # ./users.nix

    # Import your generated (nixos-generate-config) hardware configuration
    ./hardware-configuration.nix
    ./disko.nix
+   ./impermanence.nix
  ];
}
```

