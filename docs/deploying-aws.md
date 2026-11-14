# Deploying Ricochet to AWS (one server)

This puts the whole backend on one small server you control: the API, the database, Redis and the https front door,
all in Docker. It is the cheapest setup that is still reasonable for a beta, and because it is plain Docker it also runs
on any other host, so you are not locked into AWS.

**Cost, roughly:** about $18 to $22 a month after credits (email is free at first, see section 6) (the server about $12 to $14, its disk about $3, its public IP
address about $4). These are estimates, so check the AWS Pricing Calculator. The free plan's credits cover the first
months.

**The clock:** the AWS Free plan lasts 6 months or until the credits run out, whichever is first. When it ends the
account closes unless you upgrade to the paid plan. See "When the free plan ends" at the bottom, and read it early.

## 0. Before anything else: a billing alarm (2 minutes, free)

Console, **Billing and Cost Management**, **Budgets**, **Create budget**, "Zero spend" or a monthly cost budget of
$10, with your email. This is what stops a mistake turning into a surprise bill. Do it first.

## 1. Choose a region and make a key

Pick one region and stay in it (top right of the console). London (`eu-west-2`), Ireland (`eu-west-1`) or Frankfurt
(`eu-central-1`) are cheap and mature. Cape Town (`af-south-1`) is closer to Nigeria but costs more and has to be enabled.
For chat the difference is small.

EC2, **Key pairs**, **Create key pair**: type RSA, format `.pem`. Keep the downloaded file private. It is how you log in.

## 2. Launch the server

EC2, **Launch instance**:

| Setting | Choose |
| --- | --- |
| Name | `ricochet` |
| Image | **Ubuntu Server 24.04 LTS**, 64-bit **Arm** |
| Instance type | **t4g.small** (2 GB). If it is not offered, `t3.small` with the x86 image works the same |
| Key pair | the one you made |
| Storage | **30 GB gp3** |
| Network, security group | new group. Allow **SSH (22) from "My IP"**, **HTTP (80)** and **HTTPS (443)** from anywhere |

Do **not** open any other port. Postgres and Redis are never reachable from the internet.

Then EC2, **Elastic IPs**, **Allocate**, and **Associate** it with the instance. This gives the server an address that
survives restarts. (An unattached Elastic IP costs money, so release it if you delete the server.)

## 3. Point a name at it

At the place where your domain's DNS is managed, add an **A record**: `api` (or `api.ricochet`, whatever address you
chose for the API) to the Elastic IP. Wait a few minutes, then check it from your computer: `nslookup api.yourdomain`.

The app needs this name, not the raw IP: Android requires https, and certificates are issued for names.

## 4. Prepare the server

Connect (from the folder with your key):

```bash
ssh -i ricochet.pem ubuntu@<the elastic ip>
```

Then, on the server:

```bash
# Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
# A little swap, so a busy moment does not crash a 2 GB machine
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
# Security updates install themselves
sudo apt-get install -y unattended-upgrades awscli git
exit
```

Log in again so the Docker permission takes effect.

## 5. Get the code onto the server

If the repository is public: `git clone https://github.com/<you>/ricochet.git`. If it is private, create a read-only
**deploy key** (GitHub repo, Settings, Deploy keys), put the private half on the server, and clone with the SSH address.

```bash
cd ricochet/deploy
cp .env.example .env
chmod 600 .env
nano .env
```

Fill in every value in `.env`. Make the two secrets with `openssl rand -base64 36`. Keep a copy of this file somewhere
safe (a password manager): losing `JWT_SECRET` signs everyone out, losing `POSTGRES_PASSWORD` locks you out of the data.

## 6. Email

People sign in with an emailed code, so email must work before anyone else tries. Start with **Resend**. At the time of
writing its free plan is 3,000 emails a month, at most 100 a day, with one domain (check resend.com/pricing for the
current limits). Every sign-in, and every "send the code again", is one email.

1. Create a Resend account. **Domains, Add domain.** Use a subdomain just for sending, for example `mail.yourdomain`,
   so mail reputation never touches your main domain.
2. Resend shows DNS records (SPF, DKIM, and one for bounces). Add them where your DNS is managed, then click **Verify**.
   This can take from minutes to a few hours. Without it, sign-in emails land in spam or are refused.
3. **API Keys, Create API key**, with sending access for that domain only. Copy it once, it is not shown again.
4. In `deploy/.env` set:

   ```
   SMTP_HOST=smtp.resend.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=resend
   SMTP_PASS=<the API key>
   MAIL_FROM=Ricochet <no-reply@mail.yourdomain>
   ```

5. After step 7 starts the server, **send a test email** before you trust it:

   ```bash
   docker compose exec api node dist/send-test-mail.js you@gmail.com
   ```

   It says whether it connected, signed in and sent. Check the inbox and the spam folder.

**When you reach the daily limit,** sign-in codes stop arriving until the limit resets (Resend counts days in UTC) and
people see an error. Watch for this as the beta grows. Your options then are Resend's paid plan, or **Brevo**: its free
plan allows about 300 emails a day over SMTP, though Brevo approves your account before you can send. Its settings are in
`deploy/.env.example`. Moving between providers is only a change to those `SMTP_` lines, then
`docker compose up -d`. Amazon SES is a third option, but new SES accounts start in a sandbox (about 200 emails a day,
only to addresses you have verified) until AWS approves production access.

## 7. Start it

```bash
cd ~/ricochet/deploy
docker compose up -d --build
```

The first build takes several minutes. Watch with `docker compose ps` and `docker compose logs -f api`. When `api` shows
`healthy`, check from your own computer:

```bash
curl https://api.yourdomain/health
```

You should see `{"status":"ok","database":"up", ...}`. Caddy fetches the https certificate on first use, which can take
a minute. If it does not work, see Troubleshooting.

## 8. Point the app at it

`apps/mobile/eas.json` already points at `https://api.ricochet.adeyemiabiade.me`. If that is the name you used in step 3,
nothing to change. Otherwise edit the one `EXPO_PUBLIC_API_URL` line in its `base` profile. Then follow
`docs/releasing-android.md` to build the APK.

Test on a phone: sign in with an emailed code, make a hub, send a message, record a voice note.

## 9. Backups (do this the same day)

The database is the one thing you cannot rebuild. Make a private S3 bucket for copies, give the server permission to
write to it (EC2, the instance's **IAM role**, a policy allowing `s3:PutObject` on that bucket only), and put
`BACKUP_S3_URI=s3://your-bucket/db` in `.env`. Then schedule it:

```bash
chmod +x ~/ricochet/deploy/*.sh
crontab -e
```

```cron
30 2 * * *  /home/ubuntu/ricochet/deploy/backup.sh >> /home/ubuntu/backup.log 2>&1
45 2 * * 0  /home/ubuntu/ricochet/deploy/backup.sh --media >> /home/ubuntu/backup.log 2>&1
```

**Practise the restore once, before you need it.** To restore into a fresh server after starting `docker compose up -d postgres`:

```bash
cd ~/ricochet/deploy
docker compose exec -T postgres pg_restore -U ricochet -d ricochet --clean --if-exists < backups/ricochet-<stamp>.dump
```

Also turn on EBS snapshots (EC2, **Lifecycle Manager**, a daily policy) as a second layer.

## 10. Updating

After merging new code to `main`, on the server: `~/ricochet/deploy/deploy.sh`. It pulls, rebuilds, runs database
migrations first, then restarts the API. Expect a few seconds of downtime.

## 11. Keeping an eye on it

- A free uptime check (for example UptimeRobot) on `https://api.yourdomain/health` that emails you when it fails.
- `docker compose logs --tail 100 api` when something looks wrong.
- `df -h` now and then. Voice and video notes live on this disk, so it fills up. Grow the EBS volume in the console if it
  passes about 70 percent. Later you can move files to Cloudflare R2 (already supported: `MEDIA_PROVIDER=r2`).

## When the free plan ends

You will see the end date on the Billing page. Before it:

1. **Decide:** upgrade the account to the **paid plan** (it stays open, and leftover credits still apply to bills), or
   move to a cheaper host (a small VPS from another provider often costs a few dollars a month for the same 2 GB).
2. **Take a fresh backup** (`./backup.sh --media`) and download it to your own computer whatever you decide.
3. **Moving is easy:** the same Docker setup runs anywhere. On the new server: clone, fill in `.env`, restore the dump,
   untar the media, change the DNS `A` record. People keep their accounts because the data and `JWT_SECRET` come with you.

## Troubleshooting

| What you see | Likely cause |
| --- | --- |
| `https://` does not load, the browser warns about the certificate | the DNS record has not reached this server yet, or port 80 or 443 is closed in the security group. Check `docker compose logs caddy` |
| `curl /health` says `database: down` | `docker compose logs postgres`. A wrong `POSTGRES_PASSWORD` after the first start needs the volume reset, which deletes data, so ask before doing it |
| Sign-in codes never arrive | check `docker compose logs api` for mail errors, the SMTP values, and that SPF and DKIM are set. Look in spam |
| The API restarts in a loop | `docker compose logs api`. A missing or too-short `JWT_SECRET` is a common cause |
| Out of memory | check `free -h`. Confirm the swap file is on. Consider the next size up |
| The app cannot connect from a phone | the phone needs `https://` and the exact name in `eas.json`. Rebuild the APK after changing it |
