# SentinelID: Technical Architecture & Biometric Presentation Attack Detection Specification

## Problem Statement ID: SIH26188
**Title:** AI-Based Fake Identity & Document Screening System  
**Category:** Software / Homeland Security & Cybersecurity  
**Target Agency:** Ministry of Home Affairs (MHA) · Sashastra Seema Bal (SSB)  
**Deployment Objective:** Offline-capable, high-throughput identity credential screening at India–Nepal and India–Bhutan land-border checkpoints.

---

## 1. System Pipeline Overview

```
                      ┌────────────────────────────────────────┐
                      │        Traveler Presentation           │
                      │  [Physical Document] + [Live Selfie]   │
                      └──────────────────┬─────────────────────┘
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   ▼                                           ▼
      ┌─────────────────────────┐                 ┌─────────────────────────┐
      │ Document Image / PDF    │                 │ Live Camera Stream      │
      └────────────┬────────────┘                 └────────────┬────────────┘
                   │                                           │
         ┌─────────┴─────────┐                       ┌─────────┴─────────┐
         ▼                   ▼                       ▼                   ▼
 ┌───────────────┐   ┌───────────────┐       ┌───────────────┐   ┌───────────────┐
 │   Pipeline 1  │   │   Pipeline 2  │       │   Pipeline 3  │   │   Pipeline 4  │
 │  ICAO 9303    │   │  Forensic ELA │       │ Biometric PAD │   │ ArcFace Match │
 │  MRZ & OCR    │   │ Tamper Engine │       │ Liveness Test │   │ 512-D Tensor  │
 └───────┬───────┘   └───────┬───────┘       └───────┬───────┘   └───────┬───────┘
         │                   │                       │                   │
         └───────────────────┼───────────────────────┴───────────────────┘
                             ▼
             ┌───────────────────────────────┐
             │ Fused Threat Assessment Engine│
             │   (Composite Risk [0..100])   │
             └───────────────┬───────────────┘
                             ▼
             ┌───────────────────────────────┐
             │  Operational Border Decision  │
             │   ALLOW / REVIEW / DENY ENTRY │
             └───────────────────────────────┘
```

---

## 2. Multi-Modal Verification Mathematical Formulations

### 2.1 Pipeline 1: ICAO 9303 Cryptographic MRZ Validation
The Machine Readable Zone (MRZ) encodes check digits calculated with weight factors $w \in \{7, 3, 1\}$ modulo 10:
$$\text{Checksum} = \left( \sum_{i=1}^{n} c_i \cdot w_{(i-1) \pmod 3} \right) \pmod{10}$$
Where characters $A\dots Z$ map to integers $10\dots 35$ and filler $<$ maps to 0. Four independent check digits are verified:
1. Document Number Check Digit
2. Date of Birth Check Digit
3. Expiration Date Check Digit
4. Composite Check Digit (encompassing whole MRZ sequence)

### 2.2 Pipeline 2: In-Memory Error Level Analysis (ELA)
When an image undergoes JPEG compression, high-frequency DCT quantization levels stabilize at a specific quality factor $Q_1$. Digital editing introduces non-uniform quantization differences upon re-saving at $Q_2 = 90$:
$$D(x, y) = |I_{original}(x, y) - I_{resaved}(x, y)|$$
$$ELA(x, y) = \text{Enhance}\left(D(x, y) \cdot \frac{255}{\max(D)}\right)$$
Tiled spatial Laplacian gradient variance across $8 \times 8$ blocks evaluates splicing edge boundaries:
$$\sigma_{tile}^2 = \text{Var}\left(\nabla^2 I_{tile}\right), \quad CV = \frac{\text{Std}(\sigma_{tile}^2)}{\text{Mean}(\sigma_{tile}^2)}$$

### 2.3 Pipeline 3: Presentation Attack Detection (PAD) & Biometric Liveness
Compliant with **ISO/IEC 30107-3** standards for biometric presentation attacks:
1. **2D Fast Fourier Transform (FFT) Moiré Spectrum:** Digital screens emit periodic pixel grids producing discrete delta spikes in the high-frequency 2D power spectrum:
   $$F(u, v) = \sum_{x=0}^{M-1} \sum_{y=0}^{N-1} f(x, y) e^{-j 2\pi \left(\frac{ux}{M} + \frac{vy}{N}\right)}$$
   $$\text{Screen Spike Metric} = \sum_{(u, v) \in \Omega_{HF}} \mathbb{I}\left( \log|F(u, v)| > \mu + 3.2\sigma \right)$$
2. **Skin Chrominance Naturalness:** Evaluated in YCbCr color space against the biometric epidermal locus:
   $$130 \le C_r \le 178 \quad \text{and} \quad 75 \le C_b \le 130$$
3. **3D Surface Reflectance:** Evaluates opposing horizontal Sobel directional gradients across the nasal midline to detect 3D volume versus 2D planar presentation.

### 2.4 Pipeline 4: ArcFace Deep Biometric Feature Embedding
DeepFace extracts a normalized 512-dimensional feature embedding $\mathbf{v}_{doc}, \mathbf{v}_{live} \in \mathbb{R}^{512}$ via Additive Angular Margin Loss (ArcFace):
$$L_{Arc} = -\log \frac{e^{s(\cos(\theta_{y_i} + m))}}{e^{s(\cos(\theta_{y_i} + m))} + \sum_{j \ne y_i} e^{s \cos \theta_j}}$$
Biometric similarity is evaluated by Cosine Distance:
$$d_{cosine}(\mathbf{v}_{doc}, \mathbf{v}_{live}) = 1 - \frac{\mathbf{v}_{doc} \cdot \mathbf{v}_{live}}{\|\mathbf{v}_{doc}\| \|\mathbf{v}_{live}\|}$$
- Verified Match: $d_{cosine} < 0.55$
- Calibrated Similarity: $\text{Score} = \max\left(0, 100 \times (1 - d_{cosine})\right)$

---

## 3. Threat Assessment Matrix

| Final Risk Score | Risk Tier | Operational Directive | Prescribed Officer Protocol |
|---|---|---|---|
| **0 – 30** | **LOW** | `ALLOW ENTRY` | Traveler credential cleared; border gate automated pass. |
| **31 – 60** | **MEDIUM** | `SECONDARY INSPECTION` | Physical watermark inspection & manual supervisor interview. |
| **61 – 100** | **HIGH** | `DENY ENTRY / SEIZE` | Presentation attack or document forgery alert; detain traveler for forensic investigation. |

