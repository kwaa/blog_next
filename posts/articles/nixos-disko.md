---
title: NixOS 安装与配置（一）：使用 Disko 对硬盘进行声明式分区
tags:
  - NixOS
published: 2024-03-13
---

最近换到 NixOS 了，安装记录写太长干脆多写一点分段发布。

## 目录

1. 使用 Disko 对硬盘进行声明式分区 (you are here)

## 准备

接 [上文](https://kwaa.dev/ventoy-archlinux)，我有一个安装了 Ventoy 的移动硬盘。

从 NixOS 网站下载 [Minimal ISO image (64-bit Intel/AMD)](https://nixos.org/download/#nixos-iso)，放入文件夹并进入 LiveCD 环境。

## 配置

这里从 Disko 提供的 [LUKS Btrfs Subvolumes 示例配置](https://github.com/nix-community/disko/blob/master/example/luks-btrfs-subvolumes.nix) 开始。

```bash
cd /tmp
curl https://raw.githubusercontent.com/nix-community/disko/master/example/luks-btrfs-subvolumes.nix -o /tmp/disko-config.nix
```

首先对它（的上半部分）进行一些基础更改：

```diff
{
  disko.devices = {
    disk = {
-     vdb = {
+     nvme0n1 = {
        type = "disk";
-       device = "/dev/vdb";
+       device = "/dev/nvme0n1";
        content = {
          type = "gpt";
          partitions = {
            ESP = {
-             size = "512M";
+             size = "1G";
              type = "EF00";
              content = {
                type = "filesystem";
                format = "vfat";
                mountpoint = "/boot";
                mountOptions = [ "defaults" ];
              };
            };
            luks = {
              size = "100%";
              content = {
                type = "luks";
-               name = "crypted";
+               name = "cryptroot";
```

- 本次使用 `/dev/nvme0n1` 作为系统盘。
- 虽然 512M 的 ESP 很合理，但是 1G 可以给我更多安全感。（2T 的盘不差这点）
- cryptroot 命名更常见（个人喜好）

### LUKS

我使用 U 盘分区中的密钥文件。~~因为尝试 `systemd-cryptenroll` FIDO2 翻车了~~

预先 FAT32 格式化，通过 `ls -l /dev/disk/by-id` 查看一下分区 ID；

这里是 `/dev/disk/by-id/usb-Acer_USB_Flash_Drive_2235079219404-0:0-part1`。

挂载并写入一个 8192 长度的 `nixos.key` 文件：

```bash
sudo mkdir -p /key
sudo mount -n -t vfat -o rw /dev/disk/by-id/usb-Acer_USB_Flash_Drive_2235079219404-0:0-part1 /key
sudo dd if=/dev/random of=/key/nixos.key bs=8192 count=1
```

修改配置：

```diff
{
  luks = {
    size = "100%";
    content = {
      type = "luks";
      name = "cryptroot";
      settings = {
        allowDiscards = true;
+       bypassWorkqueues = true; # 禁用工作队列以提高 SSD 性能
-       keyFile = "/tmp/secret.key";
+       keyFile = "/key/nixos.key"; # 密钥文件挂载位置
+       keyFileSize = 8192; # 密钥文件大小
+       preOpenCommands = ''
+         mkdir -m 0755 -p /key
+         sleep 5
+         until mount -n -t vfat -o ro /dev/disk/by-id/usb-Acer_USB_Flash_Drive_2235079219404-0:0-part1 /key 2>&1 1>/dev/null; do
+           echo 'Could not find /dev/disk/by-id/usb-Acer_USB_Flash_Drive_2235079219404-0:0-part1, retrying...'
+           sleep 2
+         done
+       '';
+       postOpenCommands = ''
+         umount /key
+         rm -rf /key
+       '';
      };
      # content = ...
    }
  }
}
```

preOpenCommands / postOpenCommands 部分我参考了 [NixOS Wiki](https://nixos.wiki/wiki/Full_Disk_Encryption#Option_2:_Copy_Key_as_file_onto_a_vfat_usb_stick) 和 [github:reo101/rix101](https://github.com/reo101/rix101/blob/master/machines/nixos/x86_64-linux/jeeves/disko.nix)，后者主要是失败后自动重试。

### 无状态

我从一开始就准备使用 [Impermanence](https://github.com/nix-community/impermanence)。

本节不会详细说明，简单来说只需要两个 btrfs 子卷——`/nix` 和 `/persist`。

接上面的 `content`，替换 `subvolumes`：

```diff
{
  content = {
    type = "btrfs";
    extraArgs = [ "-f" ];
    subvolumes = {
-     "/root" = {
+     "/persist" = {
-       mountpoint = "/";
+       mountpoint = "/persist";
        mountOptions = [ "compress=zstd" "noatime" ];
+     };
-     "/home" = {
-       mountpoint = "/home";
-       mountOptions = [ "compress=zstd" "noatime" ];
-     };
      "/nix" = {
        mountpoint = "/nix";
        mountOptions = [ "compress=zstd" "noatime" ];
      };
-     "/swap" = {
-       mountpoint = "/.swapvol";
-       swap.swapfile.size = "20M";
-     };
    };
  };
}
```

persist 子卷需要设置 neededForBoot，添加在配置末尾。

```nix
fileSystems."/persist".neededForBoot = true;
```

为什么删掉 swap？因为我觉得我用不到。

接下来添加两个 tmpfs 分区：

```diff
{
  disko.devices = {
    disk.nvme0n1 = { ... };
+   nodev = {
+     "/" = {
+       fsType = "tmpfs";
+       mountOptions = [ "defaults" "size=2G" "mode=755" "noatime" ];
+     };
+     "/home/kwa" = {
+       fsType = "tmpfs";
+       mountOptions = [ "defaults" "size=2G" "mode=777" "noatime" ];
+     };
+   };
  };
}
```

## 应用配置

```bash
sudo nix --experimental-features "nix-command flakes" \
  run github:nix-community/disko -- \
  --mode disko /tmp/disko-config.nix
```

运行一下 `mount | grep /mnt` 会发现已经挂载分区，本节就先到这里了。
