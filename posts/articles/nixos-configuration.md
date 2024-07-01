---
title: NixOS 安装与配置（二）：系统配置
tags:
  - NixOS
published: 2024-06-30
---

时隔许久的第二篇，由于我的 NixOS 配置已经改了很多，这里会从头开始讲——主要是思路，不一定和我当前配置一致。

此时已经分区完毕，是时候配置并安装系统了。

## 目录

1. [硬盘分区](./nixos-disko.md)
2. 系统配置 (you are here)
3. [程序配置](./nixos-programs.md)

## 系统配置

### 下载模板

我使用 `Misterio77/nix-starter-configs` 中的 `minimal` 模板。

```bash
sudo mkdir -p /mnt/etc/nixos
cd /mnt/etc/nixos
sudo nix --experimental-features "nix-command flakes" flake init -t github:misterio77/nix-starter-config#minimal
sudo mv nixos nixos_old
```

### 生成默认配置

```bash
# 生成默认配置
sudo nixos-generate-config --no-filesystems --root /mnt
# 将默认配置移动到 /mnt/etc/nixos/nixos
sudo mv configuration.nix /mnt/etc/nixos/nixos
sudo mv hardware-configuration.nix /mnt/etc/nixos/nixos
```

### 合并 home-manager 到系统配置

我希望更新系统的同时更新用户环境（而不是分开），所以我这么做了。

```diff
# flake.nix
{
  outputs = {
    self,
    nixpkgs,
    home-manager,
    ...
  } @ inputs: let
    inherit (self) outputs;
  in {
    # NixOS configuration entrypoint
    # Available through 'nixos-rebuild --flake .#your-hostname'
    nixosConfigurations = {
      # FIXME replace with your hostname
      your-hostname = nixpkgs.lib.nixosSystem {
        specialArgs = {inherit inputs outputs;};
        # > Our main nixos configuration file <
        modules = [./nixos/configuration.nix];
      };
    };

-   # Standalone home-manager configuration entrypoint
-   # Available through 'home-manager --flake .#your-username@your-hostname'
-   homeConfigurations = {
-     # FIXME replace with your username@hostname
-     "your-username@your-hostname" = home-manager.lib.homeManagerConfiguration {
-       pkgs = nixpkgs.legacyPackages.x86_64-linux; # Home-manager requires 'pkgs' instance
-       extraSpecialArgs = {inherit inputs outputs;};
-       # > Our main home-manager configuration file <
-       modules = [./home-manager/home.nix];
-     };
-   };
  };
}
```

创建 `nixos/home-manager.nix` 并添加导入。

```nix
# nixos/home-manager.nix
{
  home-manager = {
    useGlobalPkgs = true;
    useUserPackages = true;
    extraSpecialArgs = { inherit inputs outputs; };
    # 将 user 替换为你的用户名
    users.user.imports = [ ../home-manager/home.nix ];
  };
}
```

```diff
# nixos/configuration.nix
{ inputs, ... }: {
  imports = [
    inputs.disko.nixosModules.disko
+   inputs.home-manager.nixosModules.home-manager
    # If you want to use modules from other flakes (such as nixos-hardware):
    # inputs.hardware.nixosModules.common-cpu-amd
    # inputs.hardware.nixosModules.common-ssd

    # You can also split up your configuration and import pieces of it here:
    # ./users.nix

    # Import your generated (nixos-generate-config) hardware configuration
    ./hardware-configuration.nix
    ./disko.nix
+   ./home-manager.nix
  ];
}
```

### 修改 username 和 hostname

```diff
# home-manager/home.nix
{
- # TODO: Set your username
  home = {
-   username = "your-username";
+   username = "user";
-   homeDirectory = "/home/your-username";
+   homeDirectory = "/home/user";
  };
}
```

你可以为密码使用 `initialHashedPassword` 以免公开配置被别人一眼知道密码，但真正需要安全性还是推荐使用秘密管理工具如 agenix, sops-nix。（此处使用 12345678 作为示例密码）

```diff
# nixos/configuration.nix
{
  # TODO: Set your hostname
- networking.hostName = "your-hostname";
+ networking.hostName = "nixos";

  # TODO: Configure your system-wide user settings (groups, etc), add more users as needed.
  users.users = {
    # FIXME: Replace with your username
-   your-username = {
+   user = {
-     # TODO: You can set an initial password for your user.
-     # If you do, you can skip setting a root password by passing '--no-root-passwd' to nixos-install.
-     # Be sure to change it (using passwd) after rebooting!
-     initialPassword = "correcthorsebatterystaple";
+     initialHashedPassword = '$y$j9T$uHvTYvBaiCoFrqLAxadlK.$H.0sn.NZt8t6ZMu98OkAC7gFjAucoWRNG8LBfp/xpPB";
    };
  };
}
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

这部分复杂一点：首先从 [README](https://github.com/nix-community/impermanence#btrfs-subvolumes) 搬一个基础配置，只需要其中的 boot.initrd.postDeviceCommands 部分。

进行一些修改，使它适合我的分区：

> 你还可以调整 `mtime`，以缩短或增加旧文件保留时间。

```diff
# nixos/impermanence.nix
{
  boot.initrd.postDeviceCommands = lib.mkAfter ''
    mkdir /btrfs_tmp
-   mount /dev/root_vg/root /btrfs_tmp
+   mount /dev/mapper/cryptroot /btrfs_tmp
    if [[ -e /btrfs_tmp/root ]]; then
        mkdir -p /btrfs_tmp/old_roots
        timestamp=$(date --date="@$(stat -c %Y /btrfs_tmp/root)" "+%Y-%m-%-d_%H:%M:%S")
        mv /btrfs_tmp/root "/btrfs_tmp/old_roots/$timestamp"
    fi

    delete_subvolume_recursively() {
        IFS=$'\n'
        for i in $(btrfs subvolume list -o "$1" | cut -f 9- -d ' '); do
            delete_subvolume_recursively "/btrfs_tmp/$i"
        done
        btrfs subvolume delete "$1"
    }

    for i in $(find /btrfs_tmp/old_roots/ -maxdepth 1 -mtime +30); do
        delete_subvolume_recursively "$i"
    done

    btrfs subvolume create /btrfs_tmp/root
    umount /btrfs_tmp
  '';
}
```

在同一个文件下面添加常规的 impermanence 配置：

```nix
# nixos/impermanence.nix
{
  programs.fuse.userAllowOther = true;
  environment.persistence."/persist" = {
    hideMounts = true;
    # https://nixos.wiki/wiki/Impermanence#Persisting
    directories = [
      "/var/log"
      "/var/lib/bluetooth"
      "/var/lib/nixos"
      "/var/lib/systemd/coredump"
      "/var/tmp"
      "/etc/NetworkManager/system-connections"
    ];
    files = [
      "/etc/machine-id"
    ];
  };
}
```

这里声明了保留 `machine-id` 和一些系统文件夹。

添加导入：

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
    inputs.home-manager.nixosModules.home-manager
+   inputs.impermanence.nixosModules.impermanence
    # If you want to use modules from other flakes (such as nixos-hardware):
    # inputs.hardware.nixosModules.common-cpu-amd
    # inputs.hardware.nixosModules.common-ssd

    # You can also split up your configuration and import pieces of it here:
    # ./users.nix

    # Import your generated (nixos-generate-config) hardware configuration
    ./hardware-configuration.nix
    ./disko.nix
    ./home-manager.nix
+   ./impermanence.nix
  ];
}
```

#### 配置 impermanence 的 home-manager 模块

没结束，impermanence 还有一个 home-manager 模块。

创建 `home-manager/impermanence.nix` 文件，它会从 `home.homeDirectory` 读取用户文件夹，因此不用再硬编码用户名。

由于 `/etc/nixos` 只有 root 能正常写入，这里声明了一个 `~/.os` 文件夹用于之后存放 NixOS 配置。

```nix
# home-manager/impermanence.nix
{ config, ... }: {
  home.persistence."/persist${config.home.homeDirectory}" = {
    # https://github.com/nix-community/impermanence#home-manager
    directories = [
      "Downloads"
      "Music"
      "Pictures"
      "Documents"
      "Videos"
      ".os" # /etc/nixos alternative
    ];
    allowOther = lib.mkForce true;
  };
}
```

添加导入：

```diff
# home-manager/home.nix
{
  imports = [
    # If you want to use home-manager modules from other flakes (such as nix-colors):
    # inputs.nix-colors.homeManagerModule
+   inputs.impermanence.nixosModules.home-manager.impermanence

    # You can also split up your configuration and import pieces of it here:
    # ./nvim.nix
+   ./impermanence.nix
  ];
}
```

## 应用配置

接下来安装一些应用。

其中一部分是 NixOS 配置，另一部分是 Home Manager 配置，我会在首行注释说明应该加在哪里。

### gnome

```nix
# nixos/*.nix
{ pkgs, ... }: {
  services.xserver.enable = true;
  services.xserver.displayManager.gdm.enable = true;
  services.xserver.displayManager.gdm.wayland = true;
  services.xserver.desktopManager.gnome.enable = true;
  services.xserver.desktopManager.xterm.enable = false;
  services.xserver.excludePackages = with pkgs; [ xterm ];

  environment.systemPackages = with pkgs.gnome; [
    dconf-editor
    gnome-shell-extensions
    gnome-tweaks
  ];
}
```

### google-chrome

```nix
# home-manager/*.nix
{ config, pkgs, ... }: {
  home.packages = with pkgs; [ google-chrome ];
  home.persistence."/persist${config.home.homeDirectory}".directories = [
    ".config/google-chrome"
  ];
}
```

### vscode

```nix
# home-manager/*.nix
{ pkgs, ... }: {
  programs.vscode.enable = true;
  programs.vscode.enableUpdateCheck = false;
  programs.vscode.extensions = with pkgs.vscode-extensions; [
    ...
  ];
  programs.vscode.userSettings = {
    ...
  };
}
```

## 安装

记下上面设置的 `networking.hostName`，这里示例为 `nixos`.

```bash
NIX_CONFIG="experimental-features = nix-command flakes" \
  sudo nixos-install --flake .#nixos --no-root-passwd
```

会经历一段漫长的下载，安装完之后先把配置复制到 `/mnt/home/user/.os` 再重启（我的配置放在 GitHub，所以我也不清楚到底有没有用）

```bash
cp -r /mnt/etc/nixos/. /mnt/home/user/.os
reboot
```

