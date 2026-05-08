# Subtask 3 — Testes Integrados de Upload (Frontend + BFF + Backend)

Este documento e o template de evidencias para anexar no PR.

## Pre-condicoes
- Backend com `app.documents.max-file-size=200MB`.
- Frontend/BFF na branch `feature/upload-limit-frontend-unificado`.
- Usuario com permissao para enviar arquivos no contrato.
- Contrato existente para vincular upload (`ownerType=PROJECT` e `ownerId` valido).

## Endpoints envolvidos
- BFF: `POST /api/backend/documents`
- Backend: `POST /documents`
- Listagem: `GET /api/backend/documents?ownerType=PROJECT&ownerId={id}`

## Arquivos de teste sugeridos
- `ok-1mb.pdf` (valido, abaixo de 200MB)
- `big-201mb.pdf` (acima de 200MB)
- `invalid-type.exe` (ou arquivo com MIME nao permitido)

## Roteiro por cenario

### 1) Arquivo abaixo do limite (sucesso)
1. Abrir tela de upload (ex.: `Contratos > [id] > Arquivos`).
2. Selecionar `ok-1mb.pdf`.
3. Confirmar envio.
4. Validar:
   - upload concluido;
   - arquivo aparece na lista;
   - sem loading travado.

Evidencias a anexar:
- Status HTTP do upload.
- Payload/resposta da API.
- Print da tela com arquivo listado.
- Consulta no banco mostrando `documents.size_bytes` do arquivo.

### 2) Arquivo acima do limite (bloqueio)
1. Selecionar `big-201mb.pdf`.
2. Validar bloqueio no frontend antes da requisicao (quando aplicavel na tela).
3. Se enviar via Insomnia direto no endpoint, validar resposta do backend.

Evidencias a anexar:
- Mensagem de erro na UI.
- Status HTTP (esperado `413` no parser multipart ou `400` no service).
- Mensagem API amigavel.
- Confirmacao de que nenhum documento foi criado.

### 3) Content-Type invalido
1. Tentar upload de `invalid-type.exe`.
2. Validar bloqueio no frontend por MIME.
3. Testar via Insomnia alterando arquivo/tipo para garantir bloqueio backend.

Evidencias a anexar:
- Mensagem de erro na UI.
- Status HTTP + payload de erro da API.
- Confirmacao de bloqueio sem persistencia.

### 4) Falha de backend/storage
1. Simular falha de storage (ex.: indisponibilidade S3/local storage).
2. Repetir upload de arquivo valido.
3. Validar:
   - erro amigavel para usuario;
   - sem stack trace na resposta;
   - loading finaliza;
   - sem estado inconsistente na lista de arquivos.

Evidencias a anexar:
- Status HTTP + payload de erro.
- Print da UX.
- Trecho de log interno (sem segredos).
- Confirmacao de nao persistencia inconsistente.

## Template para colar no PR

### Cenario: arquivo abaixo do limite
- Arquivo:
- Resultado backend:
- Status HTTP:
- Mensagem API:
- UX:
- Persistencia (`documents.size_bytes`):

### Cenario: arquivo acima do limite
- Arquivo:
- Resultado backend:
- Status HTTP:
- Mensagem API:
- UX:
- Persistencia:

### Cenario: content-type invalido
- Arquivo:
- Resultado backend:
- Status HTTP:
- Mensagem API:
- UX:
- Persistencia:

### Cenario: falha de backend/storage
- Simulacao:
- Resultado backend:
- Status HTTP:
- Mensagem API:
- UX:
- Persistencia:
- Log interno:

## Consultas uteis (DB)

```sql
-- Ultimos documentos do contrato alvo
SELECT id, owner_type, owner_id, original_name, content_type, size_bytes, status, created_at
FROM documents
WHERE owner_type = 'PROJECT' AND owner_id = :ownerId
ORDER BY created_at DESC
LIMIT 20;
```

```sql
-- Verificar se arquivo bloqueado NAO foi persistido
SELECT id, original_name, size_bytes, status, created_at
FROM documents
WHERE original_name = :fileName
ORDER BY created_at DESC
LIMIT 5;
```

## Evidencia automatizada ja validada (backend)

Comando executado:

```powershell
.\mvnw.cmd "-Dtest=DocumentServiceImplTest,GlobalExceptionHandlerTest" test
```

Resultado:
- `BUILD SUCCESS`
- `Tests run: 16, Failures: 0, Errors: 0`
- Cobertura relevante:
  - limite maximo de upload;
  - resposta amigavel para `MaxUploadSizeExceededException` (`413`);
  - falha de storage com tratamento seguro.
