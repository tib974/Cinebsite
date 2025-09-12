# IONOS (SFTP)

`.env`:
```
DEPLOY_TARGET=sftp
SFTP_HOST=ssh.your-ionos-host.tld
SFTP_USER=u12345678
SFTP_PORT=22
SFTP_PATH=/path/to/htdocs
```
Puis `chmod +x deploy.sh deploy_sftp.sh && ./deploy.sh`
