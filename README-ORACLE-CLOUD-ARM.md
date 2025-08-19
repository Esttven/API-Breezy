# 🚀 Oracle Cloud ARM Deployment Guide

**Complete guide for deploying Breezy API on Oracle Cloud's Always Free ARM compute instances**

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Oracle Cloud Setup](#oracle-cloud-setup)
3. [ARM Instance Creation](#arm-instance-creation)
4. [Server Configuration](#server-configuration)
5. [Application Deployment](#application-deployment)
6. [Verification & Testing](#verification--testing)
7. [Maintenance & Monitoring](#maintenance--monitoring)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Prerequisites

### Oracle Cloud Account
- Sign up for Oracle Cloud Always Free Tier at [cloud.oracle.com](https://cloud.oracle.com)
- Verify your account (credit card required but no charges for free tier)

### SSH Key Pair
Generate SSH keys for secure access:

**Windows (PowerShell):**
```powershell
ssh-keygen -t rsa -b 4096 -f oracle_cloud_key
```

**Linux/macOS:**
```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/oracle_cloud_key
```

### Local Tools
- Docker (for local testing)
- SSH client
- SCP/SFTP client for file transfer

---

## ☁️ Oracle Cloud Setup

### 1. Create Compartment (Optional)
```
Navigation: Identity & Security > Compartments
Click: Create Compartment
Name: breezy-api-compartment
```

### 2. Setup Virtual Cloud Network (VCN)
```
Navigation: Networking > Virtual Cloud Networks
Click: Start VCN Wizard
Choose: Create VCN with Internet Connectivity
Name: breezy-api-vcn
CIDR Block: 10.0.0.0/16
```

### 3. Configure Security List
```
Navigation: Networking > Virtual Cloud Networks > Your VCN > Security Lists
Edit: Default Security List
Add Ingress Rules:
```

| Source Type | Source CIDR | IP Protocol | Source Port Range | Destination Port Range | Description |
|-------------|-------------|-------------|-------------------|------------------------|-------------|
| CIDR | 0.0.0.0/0 | TCP | All | 22 | SSH |
| CIDR | 0.0.0.0/0 | TCP | All | 3000 | API |
| CIDR | 0.0.0.0/0 | TCP | All | 80 | HTTP |
| CIDR | 0.0.0.0/0 | TCP | All | 443 | HTTPS |

---

## 🖥️ ARM Instance Creation

### 1. Create Compute Instance
```
Navigation: Compute > Instances
Click: Create Instance
```

### 2. Instance Configuration
```
Name: breezy-api-server
Placement:
  ✓ Always Free Tier Eligible
  
Image and Shape:
  Image: Oracle Linux 8 (aarch64)
  Shape: VM.Standard.A1.Flex (ARM)
  OCPUs: 1 (can increase up to 4 for free)
  Memory: 6 GB (can increase up to 24 GB for free)
  
Networking:
  VCN: breezy-api-vcn
  Subnet: public subnet
  ✓ Assign a public IPv4 address
  
SSH Keys:
  ✓ Upload public key files (.pub)
  Upload: your_oracle_cloud_key.pub
```

### 3. Create Instance
- Click **Create**
- Wait for instance to provision (2-3 minutes)
- Note down the **Public IP Address**

---

## 🔧 Server Configuration

### 1. Connect to Instance
```bash
ssh -i path/to/oracle_cloud_key opc@YOUR_PUBLIC_IP
```

### 2. Update System
```bash
sudo dnf update -y
```

### 3. Upload Setup Script
From your local machine:
```bash
scp -i path/to/oracle_cloud_key oracle-cloud-setup.sh opc@YOUR_PUBLIC_IP:/home/opc/
```

### 4. Run Automated Setup
```bash
chmod +x oracle-cloud-setup.sh
./oracle-cloud-setup.sh
```

**What the setup script does:**
- ✅ Installs Docker for ARM64
- ✅ Installs Docker Compose for ARM64
- ✅ Configures firewall rules
- ✅ Creates application directory
- ✅ Sets up systemd service
- ✅ Creates backup and deployment scripts

---

## 🚀 Application Deployment

### 1. Upload Project Files
From your local machine:
```bash
# Create archive (exclude unnecessary files)
tar -czf breezy-api.tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=generated \
  --exclude=data \
  .

# Upload to server
scp -i path/to/oracle_cloud_key breezy-api.tar.gz opc@YOUR_PUBLIC_IP:/home/opc/breezy-api/
```

### 2. Extract and Configure
```bash
ssh -i path/to/oracle_cloud_key opc@YOUR_PUBLIC_IP

cd /home/opc/breezy-api
tar -xzf breezy-api.tar.gz
rm breezy-api.tar.gz

# Configure environment
cp .env.production .env
nano .env
```

### 3. Production Environment Configuration
Edit `.env` file:
```env
# Production Environment Variables
DATABASE_URL="file:./data/database.db"

# IMPORTANT: Change this to a secure secret!
JWT_SECRET="your-super-secure-jwt-secret-minimum-32-characters-long"
JWT_EXPIRES_IN="7d"

# Server Configuration
PORT=3000
NODE_ENV=production

# CORS - Update with your domain in production
CORS_ORIGIN="*"

# Oracle Cloud ARM optimizations
NODE_OPTIONS="--max-old-space-size=1024"
```

### 4. Deploy with ARM64 Optimization
```bash
# Use ARM64-specific deployment
./deploy-arm64.sh

# Or manual deployment
docker-compose -f docker-compose.arm64.yml up -d
```

### 5. Enable Auto-Start Service
```bash
sudo systemctl enable breezy-api
sudo systemctl start breezy-api
```

---

## ✅ Verification & Testing

### 1. Check Container Status
```bash
docker-compose ps
```

### 2. View Logs
```bash
docker-compose logs -f api
```

### 3. Test API Endpoints
```bash
# Health check
curl http://localhost:3000/api/health

# From external (replace YOUR_PUBLIC_IP)
curl http://YOUR_PUBLIC_IP:3000/api/health

# API base endpoint
curl http://YOUR_PUBLIC_IP:3000/api
```

### 4. Expected Response
```json
{
  "status": "healthy",
  "timestamp": "2025-08-19T00:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

### 5. Run Compatibility Check
```bash
./check-arm64-compatibility.sh
```

---

## 📊 Maintenance & Monitoring

### Daily Operations

**Check Service Status:**
```bash
./check-deployment.sh
```

**View System Resources:**
```bash
# Memory usage
free -h

# CPU usage
top

# Disk usage
df -h

# Container stats
docker stats
```

**Backup Database:**
```bash
./backup.sh
```

### Weekly Maintenance

**Update System:**
```bash
sudo dnf update -y
docker-compose pull
docker-compose up -d
```

**Clean Docker:**
```bash
docker system prune -f
```

### Deployment Updates

**Deploy New Version:**
```bash
# Upload new code
scp -i key -r . opc@YOUR_IP:/home/opc/breezy-api/

# Deploy
./deploy-arm64.sh
```

### Log Management

**Application Logs:**
```bash
# Real-time logs
docker-compose logs -f api

# Last 100 lines
docker-compose logs --tail=100 api

# Save logs to file
docker-compose logs api > app.log
```

**System Logs:**
```bash
# Service logs
sudo journalctl -u breezy-api

# System logs
sudo journalctl -f
```

---

## 🆘 Troubleshooting

### Common Issues

#### 1. Container Won't Start
```bash
# Check logs
docker-compose logs api

# Rebuild image
docker-compose down
docker build --platform linux/arm64 --no-cache -t breezy-api .
docker-compose up -d

# Check disk space
df -h
```

#### 2. Out of Memory
```bash
# Check memory usage
free -h
docker stats

# Restart containers
docker-compose restart

# If persistent, reduce memory usage
export NODE_OPTIONS="--max-old-space-size=512"
```

#### 3. Database Issues
```bash
# Check database file
ls -la data/database.db

# Reset database (CAUTION: destroys data)
rm data/database.db
docker-compose restart api
```

#### 4. Network Connection Issues
```bash
# Check firewall
sudo firewall-cmd --list-all

# Check security lists in Oracle Cloud Console
# Verify ports 22, 80, 443, 3000 are open

# Test local connectivity
curl http://localhost:3000/api/health
```

#### 5. ARM64 Compatibility Issues
```bash
# Check architecture
uname -m  # Should show aarch64

# Verify Docker platform
docker version
docker buildx ls

# Rebuild for ARM64
docker build --platform linux/arm64 -t breezy-api .
```

### Performance Optimization

#### For Limited Resources (1GB RAM):
```bash
# Add to .env
NODE_OPTIONS="--max-old-space-size=512"

# Optimize Docker
echo '{"log-driver": "json-file", "log-opts": {"max-size": "10m", "max-file": "3"}}' | sudo tee /etc/docker/daemon.json
sudo systemctl restart docker
```

#### For Better Performance (4 OCPUs, 24GB RAM):
```bash
# Scale up in Oracle Cloud Console
# Compute > Instances > Your Instance > Edit

# Update docker-compose.arm64.yml
deploy:
  resources:
    limits:
      memory: 4G
      cpus: '2.0'
```

### Emergency Recovery

#### Complete Reset:
```bash
# Stop everything
docker-compose down
sudo systemctl stop breezy-api

# Backup data
cp data/database.db ~/database_backup.db

# Clean slate
docker system prune -af
docker volume prune -f

# Redeploy
./deploy-arm64.sh
```

#### Restore from Backup:
```bash
# Stop service
docker-compose down

# Restore database
cp ~/database_backup.db data/database.db

# Restart
docker-compose up -d
```

---

## 📚 Additional Resources

### Oracle Cloud Documentation
- [Compute Service](https://docs.oracle.com/en-us/iaas/Content/Compute/Concepts/computeoverview.htm)
- [Always Free Tier](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm)
- [ARM-based Compute](https://docs.oracle.com/en-us/iaas/Content/Compute/References/arm-based-compute.htm)

### Technical References
- [Docker ARM64 Support](https://docs.docker.com/build/building/multi-platform/)
- [Prisma ARM64 Deployment](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Node.js ARM64 Performance](https://nodejs.org/en/docs/guides/simple-profiling)

### Monitoring & Alerts
- [Oracle Cloud Monitoring](https://docs.oracle.com/en-us/iaas/Content/Monitoring/Concepts/monitoringoverview.htm)
- [Container Health Checks](https://docs.docker.com/engine/reference/builder/#healthcheck)

---

## 🎉 Success Checklist

- [ ] Oracle Cloud account created
- [ ] ARM compute instance running
- [ ] SSH access working
- [ ] Docker and Docker Compose installed
- [ ] Application deployed successfully
- [ ] Health check endpoint responding
- [ ] Environment variables configured
- [ ] Database initialized
- [ ] Auto-start service enabled
- [ ] Backup script tested
- [ ] Monitoring setup

**🎯 Your Breezy API is now running on Oracle Cloud ARM!**

**Access URLs:**
- **API Base**: `http://YOUR_PUBLIC_IP:3000/api`
- **Health Check**: `http://YOUR_PUBLIC_IP:3000/api/health`
- **SSH Access**: `ssh -i key opc@YOUR_PUBLIC_IP`

**Cost: $0/month** with Oracle Cloud Always Free Tier! 🚀

---

*Need help? Check the troubleshooting section or the application logs for more details.*
