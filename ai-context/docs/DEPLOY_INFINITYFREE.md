# InfinityFree (FTP/FTPS)

Secrets GitHub: FTP_SERVER, FTP_USERNAME, FTP_PASSWORD, FTP_PORT (21), FTP_PATH (/htdocs).
Workflow: `.github/workflows/deploy-ftp.yml` déploie à chaque push sur main.

Local: `brew install lftp` puis `.env` avec FTP_* et `./deploy.sh`.
