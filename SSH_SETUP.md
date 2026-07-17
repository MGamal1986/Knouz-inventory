# Connecting to the Repo via SSH

This repo's remote uses SSH (`git@github.com:MGamal1986/Knouz-inventory.git`), so each machine that needs to `git pull`/`git push` must have its own SSH key registered on GitHub. Do this once per machine.

## 1. Check for an existing key

```bash
ls -al ~/.ssh
```

If you already see `id_ed25519` / `id_ed25519.pub` (or `id_rsa` / `id_rsa.pub`), skip to step 4.

## 2. Generate a new key

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

Press Enter to accept the default file location. You can set a passphrase or press Enter twice to leave it empty.

## 3. Start the SSH agent and add the key

```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

## 4. Add the public key to GitHub

```bash
cat ~/.ssh/id_ed25519.pub
```

Copy the full output, then go to **github.com → Settings → SSH and GPG keys → New SSH key**, paste it, and save.

## 5. Test the connection

```bash
ssh -T git@github.com
```

Expected output:

```
Hi MGamal1986! You've successfully authenticated, but GitHub does not provide shell access.
```

## 6. Clone or pull

If the repo isn't on this machine yet:

```bash
git clone git@github.com:MGamal1986/Knouz-inventory.git
```

If it's already present (e.g. copied over during a migration) and just needs to sync:

```bash
cd knouz-inventory
git pull
docker compose up -d --build
```

`--build` only rebuilds the `api`/`web` images from updated source — the `db` container and its data volumes (`pgdata`, `uploads`, `invoices`) are untouched.
