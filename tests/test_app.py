def test_root_redirects_to_static_index(client):
    response = client.get("/", follow_redirects=False)

    assert response.status_code == 307
    assert response.headers["location"] == "/static/index.html"


def test_get_activities_returns_seed_data(client):
    response = client.get("/activities")

    assert response.status_code == 200
    activities = response.json()

    assert "Chess Club" in activities
    assert activities["Chess Club"]["participants"] == [
        "michael@mergington.edu",
        "daniel@mergington.edu",
    ]


def test_signup_adds_participant_to_activity(client):
    response = client.post("/activities/Soccer%20Club/signup?email=alex@mergington.edu")

    assert response.status_code == 200
    assert response.json() == {"message": "Signed up alex@mergington.edu for Soccer Club"}

    activities_response = client.get("/activities")
    assert "alex@mergington.edu" in activities_response.json()["Soccer Club"]["participants"]


def test_signup_returns_404_for_unknown_activity(client):
    response = client.post("/activities/Unknown%20Club/signup?email=alex@mergington.edu")

    assert response.status_code == 404
    assert response.json() == {"detail": "Activity not found"}


def test_signup_returns_400_for_duplicate_participant(client):
    response = client.post("/activities/Chess%20Club/signup?email=michael@mergington.edu")

    assert response.status_code == 400
    assert response.json() == {"detail": "Student is already signed up"}


def test_remove_participant_from_activity(client):
    response = client.delete("/activities/Chess%20Club/signup?email=michael@mergington.edu")

    assert response.status_code == 200
    assert response.json() == {"message": "Removed michael@mergington.edu from Chess Club"}

    activities_response = client.get("/activities")
    assert "michael@mergington.edu" not in activities_response.json()["Chess Club"]["participants"]


def test_remove_returns_404_for_unknown_activity(client):
    response = client.delete("/activities/Unknown%20Club/signup?email=alex@mergington.edu")

    assert response.status_code == 404
    assert response.json() == {"detail": "Activity not found"}


def test_remove_returns_404_for_missing_participant(client):
    response = client.delete("/activities/Soccer%20Club/signup?email=alex@mergington.edu")

    assert response.status_code == 404
    assert response.json() == {"detail": "Student is not signed up"}