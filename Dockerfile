FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p data/threads data/knowledge data/chroma

EXPOSE 8000

ENV SINGOO_HOST=0.0.0.0
ENV SINGOO_PORT=8000

CMD ["python", "-m", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
