# WhatsApp Sticker Bot

Bot para criar stickers a partir de imagens, gifs e texto no WhatsApp.

## 🚀 Funcionalidades

- Criação de stickers a partir de imagens
- Criação de stickers a partir de vídeos
- Suporte a diferentes formatos de mídia
- Interface simples via WhatsApp

## 📋 Pré-requisitos

- Docker
- Docker Compose

## 🛠️ Instalação

1. Clone o repositório:
```bash
git clone https://github.com/Franciscoflh/whatsapp-sticker-bot.git
cd whatsapp-sticker-bot
```

2. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

3. Inicie o bot:
```bash
docker-compose up -d
```

## 📱 Como usar

1. Envie uma imagem ou vídeo para o número do bot
2. Aguarde o processamento
3. O bot enviará o sticker criado

## 🔧 Configuração

As principais configurações podem ser feitas através do arquivo `.env`:

- `NODE_ENV`: Ambiente de execução (development/production)
- `LOG_LEVEL`: Nível de log
- `MAX_STICKER_SIZE`: Tamanho máximo do sticker em MB
- `MAX_VIDEO_DURATION`: Duração máxima de vídeos em segundos

## 📦 Estrutura do Projeto

```
src/
├── config/         # Configurações
├── controllers/    # Controladores
├── models/         # Modelos
├── repositories/   # Repositórios
├── services/       # Serviços
└── utils/          # Utilitários
```

## 🔍 Monitoramento

O bot inclui um health check que pode ser acessado em:
```bash
docker-compose exec bot node ./dist/healthcheck.js
```

## 📝 Logs

Os logs são armazenados em:
```bash
docker-compose logs -f bot
```

## 🔄 Manutenção

Para atualizar o bot:
```bash
docker-compose pull
docker-compose up -d
```

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes. 