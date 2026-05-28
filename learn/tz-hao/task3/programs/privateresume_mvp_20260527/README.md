# privateresume_mvp_20260527.aleo

This Leo program models a private resume record and verifies whether the candidate meets an HR requirement.

```leo
record Resume {
    owner: address,
    solidity: bool,
    react: bool,
    years: u8,
}
```

Build from Windows PowerShell:

```powershell
npm.cmd run leo:build
```

Or from WSL:

```bash
cd programs/privateresume_mvp_20260527
leo build
```
