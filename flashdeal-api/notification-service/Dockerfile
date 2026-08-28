FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY target/*.jar app.jar
EXPOSE 8086
ENV TZ=Asia/Ho_Chi_Minh
ENTRYPOINT ["java", "-jar", "app.jar"]
