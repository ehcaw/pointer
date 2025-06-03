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

    async fn get_for_user(user_id: &str) {
        let db = client.database("quibble");
        let collection = db::collection::Document("notes");

        let filter = doc! {tenantId: user_id};
        let mut cursor = collection.find(filter, None).await?;
    }
}
