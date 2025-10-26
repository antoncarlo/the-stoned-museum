# The Stoned Museum - Deploy Guide

## 🚀 Guida al Deploy su Staging/Produzione

Questa guida spiega come deployare The Stoned Museum su un ambiente di staging o produzione.

---

## 📋 Prerequisiti

### Server Requirements

- **OS:** Ubuntu 22.04 LTS o superiore
- **Node.js:** v22.x o superiore
- **pnpm:** latest
- **MySQL:** 8.0 o superiore
- **RAM:** Minimo 2GB, consigliato 4GB
- **Storage:** Minimo 10GB

### Servizi Esterni

- **Database MySQL:** Istanza MySQL accessibile (locale o cloud)
- **Solana RPC:** Endpoint RPC Solana (mainnet o devnet)
- **OAuth Server:** Configurato per l'app

---

## 🔧 Step 1: Preparazione Server

### 1.1 Installazione Dipendenze

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Install MySQL
sudo apt install -y mysql-server

# Start MySQL
sudo systemctl start mysql
sudo systemctl enable mysql
```

### 1.2 Configurazione MySQL

```bash
# Secure MySQL installation
sudo mysql_secure_installation

# Create database
sudo mysql -e "CREATE DATABASE stoned_museum;"

# Create user (replace with your password)
sudo mysql -e "CREATE USER 'stoned_user'@'localhost' IDENTIFIED BY 'your_secure_password';"
sudo mysql -e "GRANT ALL PRIVILEGES ON stoned_museum.* TO 'stoned_user'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"
```

---

## 📦 Step 2: Clone e Setup Progetto

### 2.1 Clone Repository

```bash
# Clone from GitHub
cd /var/www
sudo git clone https://github.com/antoncarlo/the-stoned-museum.git
cd the-stoned-museum

# Set permissions
sudo chown -R $USER:$USER /var/www/the-stoned-museum
```

### 2.2 Installazione Dipendenze

```bash
# Install dependencies
pnpm install
```

---

## ⚙️ Step 3: Configurazione Ambiente

### 3.1 Creazione File .env

```bash
# Create .env file
cp .env.example .env
nano .env
```

### 3.2 Configurazione .env

```env
# Application
VITE_APP_ID=the_stoned_museum
VITE_APP_TITLE="The Stoned Museum"
VITE_APP_LOGO="https://your-cdn.com/logo.png"

# OAuth
VITE_OAUTH_PORTAL_URL=https://vida.butterfly-effect.dev
OAUTH_SERVER_URL=https://vidabiz.butterfly-effect.dev

# Database
DATABASE_URL=mysql://stoned_user:your_secure_password@localhost:3306/stoned_museum

# Security
JWT_SECRET=your_very_secure_jwt_secret_here_min_32_chars

# Server
PORT=3000
NODE_ENV=production

# Analytics (optional)
VITE_ANALYTICS_ENDPOINT=https://your-analytics.com
VITE_ANALYTICS_WEBSITE_ID=your_website_id

# Solana (optional, for future integration)
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

### 3.3 Applicazione Schema Database

```bash
# Push schema to database
pnpm db:push
```

---

## 🏗️ Step 4: Build per Produzione

### 4.1 Build Applicazione

```bash
# Build frontend and backend
pnpm run build
```

Il comando genererà:
- `dist/public/` - File statici frontend
- `dist/index.js` - Server backend

### 4.2 Verifica Build

```bash
# Check build output
ls -lh dist/
ls -lh dist/public/
```

---

## 🚀 Step 5: Deploy e Avvio

### Opzione A: Deploy con PM2 (Consigliato)

PM2 è un process manager per Node.js che garantisce uptime e auto-restart.

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start dist/index.js --name "stoned-museum"

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
# Follow the instructions printed by the command

# Check status
pm2 status
pm2 logs stoned-museum
```

### Opzione B: Deploy con systemd

Crea un service file per systemd:

```bash
sudo nano /etc/systemd/system/stoned-museum.service
```

Contenuto del file:

```ini
[Unit]
Description=The Stoned Museum
After=network.target mysql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/the-stoned-museum
Environment=NODE_ENV=production
ExecStart=/usr/bin/node /var/www/the-stoned-museum/dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Avvia il servizio:

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service
sudo systemctl enable stoned-museum

# Start service
sudo systemctl start stoned-museum

# Check status
sudo systemctl status stoned-museum

# View logs
sudo journalctl -u stoned-museum -f
```

---

## 🌐 Step 6: Configurazione Reverse Proxy (Nginx)

### 6.1 Installazione Nginx

```bash
sudo apt install -y nginx
```

### 6.2 Configurazione Nginx

```bash
sudo nano /etc/nginx/sites-available/stoned-museum
```

Contenuto del file:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration (use Certbot for Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Node.js app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 6.3 Attivazione Configurazione

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/stoned-museum /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 6.4 Configurazione SSL con Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal is configured automatically
# Test renewal
sudo certbot renew --dry-run
```

---

## 🔒 Step 7: Sicurezza

### 7.1 Firewall (UFW)

```bash
# Enable firewall
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check status
sudo ufw status
```

### 7.2 Fail2Ban (Protezione Brute Force)

```bash
# Install Fail2Ban
sudo apt install -y fail2ban

# Enable service
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 📊 Step 8: Monitoring

### 8.1 PM2 Monitoring

```bash
# View logs
pm2 logs stoned-museum

# Monitor resources
pm2 monit

# View detailed info
pm2 info stoned-museum
```

### 8.2 Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### 8.3 Application Logs

```bash
# If using systemd
sudo journalctl -u stoned-museum -f

# If using PM2
pm2 logs stoned-museum --lines 100
```

---

## 🔄 Step 9: Aggiornamenti e Manutenzione

### 9.1 Deploy Nuove Versioni

```bash
cd /var/www/the-stoned-museum

# Pull latest changes
git pull origin master

# Install dependencies
pnpm install

# Build
pnpm run build

# Restart application
pm2 restart stoned-museum
# OR
sudo systemctl restart stoned-museum
```

### 9.2 Backup Database

```bash
# Create backup script
sudo nano /usr/local/bin/backup-stoned-museum.sh
```

Contenuto dello script:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/stoned-museum"
mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u stoned_user -p'your_secure_password' stoned_museum > $BACKUP_DIR/db_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/db_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/db_$DATE.sql.gz"
```

Rendi eseguibile e configura cron:

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-stoned-museum.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
# Add this line:
0 2 * * * /usr/local/bin/backup-stoned-museum.sh
```

---

## 🐛 Troubleshooting

### Problema: Applicazione non si avvia

**Soluzione:**
```bash
# Check logs
pm2 logs stoned-museum --err
# OR
sudo journalctl -u stoned-museum -n 50

# Check database connection
mysql -u stoned_user -p -e "SHOW DATABASES;"

# Check .env configuration
cat .env
```

### Problema: 502 Bad Gateway

**Soluzione:**
```bash
# Check if app is running
pm2 status
# OR
sudo systemctl status stoned-museum

# Check Nginx configuration
sudo nginx -t

# Check port 3000 is listening
sudo netstat -tulpn | grep 3000
```

### Problema: Database connection error

**Soluzione:**
```bash
# Check MySQL is running
sudo systemctl status mysql

# Test connection
mysql -u stoned_user -p -h localhost stoned_museum

# Check DATABASE_URL in .env
grep DATABASE_URL .env
```

---

## 📝 Checklist Pre-Deploy

- [ ] Server configurato con tutti i prerequisiti
- [ ] MySQL installato e database creato
- [ ] Repository clonato
- [ ] Dipendenze installate (`pnpm install`)
- [ ] File `.env` configurato correttamente
- [ ] Schema database applicato (`pnpm db:push`)
- [ ] Build completato con successo (`pnpm run build`)
- [ ] Process manager configurato (PM2 o systemd)
- [ ] Nginx configurato come reverse proxy
- [ ] SSL certificate installato (Let's Encrypt)
- [ ] Firewall configurato (UFW)
- [ ] Backup automatico configurato
- [ ] Monitoring attivo

---

## 🎉 Deploy Completato!

Una volta completati tutti gli step, l'applicazione sarà accessibile su:

**https://your-domain.com**

---

**Documento creato:** 26 Ottobre 2025  
**Versione:** 1.0  
**Ultima modifica:** 26 Ottobre 2025

