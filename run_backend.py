from api.index import app


if __name__ == "__main__":
    print("Starting Guitar Tab Studio API server...")
    print("API running at: http://127.0.0.1:5000")
    print("Make sure to also run the frontend: cd frontend && npm run dev")
    app.run(debug=True, port=5000)
