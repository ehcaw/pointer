use mongodb::{
    bson::{doc, Document},
    Client, Collection,
};

struct MongoClientStruct {
    client: Client,
}

impl MongoClient {
    async fn new(connection_string: &str) -> Self {
        let client = Client::with_uri_str(connection_string).await.unwrap();
        Self { client }
    }
}
