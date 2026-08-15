# Project skills

Skills, относящиеся к стеку MoneyBay. Лежат в репозитории, поэтому доступны
на любой машине, куда склонирован проект, без установки Agent Toolkit.

| Skill | Зачем здесь |
|---|---|
| `aws-containers` | ECS Fargate, ECR — на них живёт backend |
| `aws-deployment` | CI/CD, деплой задачи ECS |
| `aws-iam` | роли и политики, в том числе `ecsTaskExecutionRole` |
| `creating-secrets-using-best-practices` | секреты проекта в Secrets Manager |
| `aws-security` | безопасность инфраструктуры |
| `aws-database` | RDS PostgreSQL |
| `aws-observability` | CloudWatch, логи ECS |
| `wrangler` | деплой frontend на Cloudflare Workers |

Источник — каталог Agent Toolkit for AWS (97 skills) и набор Cloudflare.
Полный набор ставится на новой машине командой:

```
aws configure agent-toolkit --yes --region us-east-1
```

Учти: `aws agent-toolkit add-skill` устанавливает только одну skill за запуск —
при нескольких вызовах подряд отвечает `404 GetLatestSkillVersion` на все, кроме
последней. Доставлять по одной:

```
aws agent-toolkit add-skill --skill-name <имя> --region us-east-1
```

Личные skills пользователя лежат отдельно, в `~/.claude/skills`, и доступны во
всех проектах. Здешние — только в этом, зато переносятся вместе с репозиторием.
