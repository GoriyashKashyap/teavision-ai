# models/

Place the trained TorchScript model artifact here:

```
lightteanet_eca_mobilevit_xxs_kd.pt
```

**Expected size**: ~0.577 MB

**Architecture**: LightTeaNet-ECA (depthwise-separable CNN + Efficient Channel Attention)

This directory is excluded from version control (see .gitignore).
The model artifact must be provided separately before Phase 2 inference integration.

## Verifying the model loaded

Start the backend and check:

```bash
curl http://localhost:8000/health
# Expected: { "status": "healthy", "model_loaded": true, ... }
```

If `model_loaded` is `false`, the server started successfully but the model file is missing.
