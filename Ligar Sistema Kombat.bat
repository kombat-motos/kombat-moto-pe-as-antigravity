@echo off
title Servidor Kombat Moto Pecas
echo Ligando o ERP da Kombat Moto... Aguarde uns segundos.
echo.

:: Abre o navegador Chrome no endereco do sistema diretamente na porta oficial do servidor
start chrome http://localhost:3001

:: Inicia o servidor e o deixa aberto para voce ver se tem algum erro
call npm run dev

pause
