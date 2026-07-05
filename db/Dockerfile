FROM postgres:16

COPY ./1-wijha.sql /docker-entrypoint-initdb.d/
COPY ./2-dummy.sql /docker-entrypoint-initdb.d/
COPY ./3-queries.sql /docker-entrypoint-initdb.d/