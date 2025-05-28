# Docker

Start in background
```
docker compose up -d
```

Check if running
```
docker ps
```

Stop
```
docker compose down
```

Rebuild container
```
docker compose build
```

Build contracts
```
docker compose exec celo forge build
```

Run tests
```
docker compose exec celo forge test
```

Enter shell
```
docker compose exec -it celo sh
```

Show logs
```
docker compose logs celo
```
