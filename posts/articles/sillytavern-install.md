---
title: I 卡也要炼！本地运行 KoboldCpp & SillyTavern
tags:
  - KoboldCpp
  - SillyTavern
---

从 Mistral 7B 发布我就想试试了，直到现在。

## 准备

[前篇](https://kwaa.dev/stable-diffusion)我在自己的便携 Arch Linux 系统上安装了 Python、Intel Compute Runtime 和 Intel oneAPI Basekit，本文继续复用上述环境。

再提一嘴我目前的硬件配置：

- CPU: Intel Core i3-12100
  - 最便宜的 12 代核显款
- RAM: 64GB DDR4-3200 (32GB*2)
  - 内存都这么便宜了。没理由不堆满，不是吗？
- GPU 0: Intel UHD Graphics 730
  - 核显。本来想体验一下 DeepLink，但是发现并没有什么用
- GPU 1: Intel Arc A770 Graphics 16GB
  - 玩游戏和跑 ML 的主力卡

如果**不打算玩 SteamVR 游戏、不满足老旧 Tesla 计算卡的性能损失、会折腾、预算不太充足**，那这套配置是很值得推荐的。

<!-- 我预先挑选了一些模型，根据需要来下载：

- [OpenPipe/mistral-ft-optimized-1227](https://huggingface.co/OpenPipe/mistral-ft-optimized-1227)
  - “最佳”的 Mistral 7B 微调基础模型，可以参考 [OpenPipe 博客](https://openpipe.ai/blog/mistral-7b-fine-tune-optimized)
  - ~~其实这是为（可能存在的）下一篇文章准备的~~
- [NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO](https://huggingface.co/NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO)
  - Mixtral 8x7B 微调，和 OpenHermes 是同一个作者。
  - 大概是当前我能用到最好的开源模型
- [SanjiWatsuki/Kunoichi-DPO-v2-7B](https://huggingface.co/SanjiWatsuki/Kunoichi-DPO-v2-7B)
- [SanjiWatsuki/Silicon-Maid-7B](https://huggingface.co/SanjiWatsuki/Silicon-Maid-7B)
- [SanjiWatsuki/Loyal-Macaroni-Maid-7B](https://huggingface.co/SanjiWatsuki/Loyal-Macaroni-Maid-7B)
  - 这三个是相同作者，听说很适合玩 RP。
- [NeverSleep/Noromaid-v0.4-Mixtral-Instruct-8x7b-Zloss](https://huggingface.co/NeverSleep/Noromaid-v0.4-Mixtral-Instruct-8x7b-Zloss)
  - Mixtral 8x7B 的 RP 特化版 -->

<!-- 一些记录：

- https://github.com/dvmazur/mixtral-offloading -->

<!-- ## KoboldAI

> 它很快，但不支持 GGUF 格式。如果你想运行 Mixtral，则不推荐使用。

[KoboldAI 支持 IPEX 和 BigDL 后端](https://github.com/henk717/KoboldAI/blob/united/environments/ipex.yml)，不用自己折腾了。

```bash
git clone https://github.com/henk717/KoboldAI
cd KoboldAI
```

好的，接下来是 `./play-ipex.sh`... 等等，让我看看它都做了些什么。

```bash
#!/bin/bash
export PYTHONNOUSERSITE=1
if [ ! -f "runtime/envs/koboldai-ipex/bin/python" ]; then
./install_requirements.sh ipex
fi

#Set OneAPI environmet if it's not set by the user
if [ ! -x "$(command -v sycl-ls)" ]
then
    echo "Setting OneAPI environment"
    if [[ -z "$ONEAPI_ROOT" ]]
    then
        ONEAPI_ROOT=/opt/intel/oneapi
    fi
    source $ONEAPI_ROOT/setvars.sh
fi

export NEOReadDebugKeys=1
export ClDeviceGlobalMemSizeAvailablePercent=100

bin/micromamba run -r runtime -n koboldai-ipex python aiserver.py $*
```

安装依赖，设置环境变量，通过 `micromamba` 运行 `aiserver.py`。

我更喜欢手动而不是用脚本去做这些事，所以让我一步步执行它：

`install_requirements.sh` 直接用 wget 下载压缩包安装到 `/bin`，太野蛮了。

[aur](https://aur.archlinux.org/) 和 [archlinuxcn](https://www.archlinuxcn.org/archlinux-cn-repo-and-mirror/) 源都提供了 micromamba，可以任选其一。

```bash
paru -S micromamba
```

在进行下一步之前，先等一下：

`environments/ipex.yml` 中 `bigdl-core-xe-21` 的版本没有在 PyPI 找到，我不确定具体原因。

所以这里我把它和 `bigdl-llm` 更新到一个**相同且尽可能新**的版本：

```diff title="environments/ipex.yml"
-   - bigdl-llm==2.5.0b20231218
+   - bigdl-llm==2.5.0b20240123
-   - bigdl-core-xe-21==2.5.0b20231218
+   - bigdl-core-xe-21==2.5.0b20240123
```

继续安装。

```bash
# export PYTHONNOUSERSITE=1
micromamba create -f environments/ipex.yml -r runtime -n koboldai-ipex -y # 如果失败就再运行一次，原脚本里跑两次是有道理的
source /opt/intel/oneapi/setvars.sh
# export NEOReadDebugKeys=1
# export ClDeviceGlobalMemSizeAvailablePercent=100
micromamba run -r runtime -n koboldai-ipex python aiserver.py
```

访问 http://localhost:5000 会显示 KoboldAI 界面。现在下载模型，这里我尝试 [TheBloke/OpenHermes-2.5-Mistral-7B-GPTQ](https://huggingface.co/TheBloke/OpenHermes-2.5-Mistral-7B-GPTQ) 的 `gptq-4bit-32g-actorder_True` 版本。

```bash
cd models
paru -S huggingface-hub
mkdir OpenHermes-2.5-Mistral-7B-16k-GPTQ
huggingface-cli download TheBloke/OpenHermes-2.5-Mistral-7B-GPTQ \
  --revision gptq-4bit-32g-actorder_True \
  --local-dir OpenHermes-2.5-Mistral-7B-GPTQ \
  --local-dir-use-symlinks False
```

事实证明用 CLI 下载很坑，还是手动下吧。

进网站选择指定 branch，把 `.gitattributes` 以外的所有文件下载到 `models/OpenHermes-2.5-Mistral-7B-GPTQ` 文件夹里。

将 `model.safetensors` 重命名为 `4bit-32g.safetensors`

不知道为什么会报错 `KeyError: 'mistral'`，所以我注释掉了这段。

卸载依赖：`micromamba remove -r runtime -n koboldai-ipex --all` -->

## KoboldCpp

KoboldCpp 支持 GGUF 模型，并且有 aur 包可以用... 等等，都过时半个月了。

希望之后可以更新吧。总之先安装**旧版本**：

> `koboldcpp-*` 有四个包，分别是：仅 CPU 的 `-cpu`、OpenCL 的 `-clblast`、CUDA 的 `-cublas` 和 ROCm 的 `-hipbias`。
>
> 这里并没有专用于 Intel GPU 的包，所以我安装 `koboldcpp-clblast`。

```bash
paru -S koboldcpp-clblast clinfo customtkinter
```

然后运行：

```bash
clinfo --list # 获取 platform_id 和 device_id
# Platform #0: Intel(R) FPGA Emulation Platform for OpenCL(TM)
#  `-- Device #0: Intel(R) FPGA Emulation Device
# Platform #1: Intel(R) OpenCL
#  `-- Device #0: 12th Gen Intel(R) Core(TM) i3-12100
# Platform #2: Intel(R) OpenCL Graphics
#  `-- Device #0: Intel(R) Arc(TM) A770 Graphics
# Platform #3: Intel(R) OpenCL Graphics
#  `-- Device #0: Intel(R) UHD Graphics 730
# 可以看到我的 A770 在 Platform #2 Device #0，所以在 --useclblast 后面写 2 0
# 注意：运行 `source /opt/intel/oneapi/setvars.sh` 之后才会出现 Intel FPGA Emulation Device 和 CPU，所以这两个 ID 可能会有所变化

koboldcpp --useclblast 2 0 --gpulayers 18 --model /home/nous-hermes-2-mixtral-8x7b-dpo.Q4_K_M.gguf
# --gpulayers 根据模型自行填写
# 对于 Mixtral 8x7B，我的 A770 可以设置为 18 层
# 对于一般 7B 模型，设置为 33 层基本是没有问题的
# --model 即为模型文件路径，不能是相对路径
```

等模型加载完，就可以连接 API 了。

## SillyTavern

```bash
git clone https://github.com/SillyTavern/SillyTavern -b staging
cd SillyTavern
```

然后 `./start.sh`... 怎么又是脚本？

这是我熟悉的 node 项目，直接安装并运行它吧。

```bash
paru -S nodejs npm
npm install # 如果你安装了 pnpm，也可以使用 pnpm install
node server.js
```

现在进入 http://localhost:8000 会看到 SillyTavern 界面。

首先设置语言并连接 API：

> 没写完，TODO

### SillyTavern Extras

ST-Extras 不支持 IPEX，所以只能使用 CPU。

```bash
git clone https://github.com/SillyTavern/SillyTavern-extras
cd SillyTavern-extras
# pip install -r requirements-silicon.txt
```

> 没写完，TODO

## 后记

总觉得这种环境搭建的文章和炼丹还是有点出入，不太符合标题。

所以下一篇系列文章我会尝试基于 [OpenPipe/mistral-ft-optimized-1227](https://huggingface.co/OpenPipe/mistral-ft-optimized-1227) 微调一个新模型。
