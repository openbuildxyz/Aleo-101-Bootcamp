# PrivateResume

PrivateResume is an Aleo MVP for private resume verification.

Candidates create a private resume record with skill flags and years of experience. HR verifies whether the candidate meets a requirement, while the UI only shows the qualification result and does not reveal the candidate's raw resume fields.

## MVP Scope

- Leo program with a private `Resume` record.
- `create_resume` function for candidate resume creation.
- `verify` function for checking `solidity == true` and `years >= min_years`.
- Next.js frontend with Aleo wallet connection and signing flow.
- Local privacy preview for the demo, plus Testnet action buttons for wallet submission/record loading.

## Project Structure

```text
app/                                      Next.js app routes and global styles
components/                               Wallet provider and PrivateResume UI
lib/                                      Shared constants and verification helpers
programs/privateresume_mvp_20260527/      Leo program source
```

## Leo Program

Source:

```text
programs/privateresume_mvp_20260527/src/main.leo
```

Core record:

```leo
record Resume {
    owner: address,
    solidity: bool,
    react: bool,
    years: u8,
}
```

After running `leo build`, Leo compiles the `Resume` record fields as private record data.


## Run The Frontend

Install dependencies:

```bash
npm install
```

Start the Next.js dev server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

On Windows PowerShell, use `npm.cmd` if script execution blocks `npm.ps1`:

```powershell
npm.cmd install
npm.cmd run dev
```

## Build The Leo Program

From a shell where `leo` is installed:

```bash
npm run leo:build
```

Or build directly:

```bash
cd programs/privateresume_mvp_20260527
leo build
```

## Demo Flow

1. Connect an Aleo wallet.
2. Sign the PrivateResume authorization message.
3. Enter candidate data:
   - Solidity: YES
   - React: YES
   - Experience: 3
4. Click `Generate Private Resume`.
5. In HR verification, require:
   - Solidity
   - Experience >= 2
6. Click `Verify Candidate`.
7. The UI displays `Candidate Qualified` without showing the candidate's private fields.

## Testnet Notes

The app is configured for `testnetbeta` and program id:

```text
privateresume_mvp_20260527.aleo
```

The wallet buttons are included for the Testnet workflow. A deployed program and Testnet credits are required before `Submit create_resume on Testnet` and wallet record loading can complete successfully.
