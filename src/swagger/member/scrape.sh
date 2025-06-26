#!/bin/bash

# 변수 설정
URL="http://3.37.227.162:8080/member/v3/api-doc"
OUTPUT_DIR="./src/swagger/member"
OUTPUT_FILE="$OUTPUT_DIR/swagger.json"

# 출력 디렉토리가 없으면 생성
mkdir -p "$OUTPUT_DIR"

# Swagger 문서 가져오기
curl -s "$URL" > "$OUTPUT_FILE"

# 상단 블록 주석 제거 (/* ... */ 형태)
sed -i "" '/^\/\*/,/\*\//d' "$OUTPUT_FILE"

# 인라인 주석 제거 (// 형태)
sed -i "" '/^[[:space:]]*\/\//d' "$OUTPUT_FILE"

# 결과 확인
echo "Processed Swagger document saved to: $OUTPUT_FILE"
