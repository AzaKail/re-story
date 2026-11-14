from django.core.management import call_command
from django.test import Client, TestCase
from catalog.models import Artifact, Body, Source


class CatalogModelsAndApiTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.moon = Body.objects.create(
            name="Moon",
            code="moon",
            radius_scene=1.0,
            texture_file="textures/moon_2k.jpg",
            description="Earth natural satellite.",
        )
        self.mars = Body.objects.create(
            name="Mars",
            code="mars",
            radius_scene=1.95,
            texture_file="textures/mars_2k.jpg",
            description="The Red Planet.",
        )
        self.apollo11 = Artifact.objects.create(
            name="Apollo 11 LM Eagle",
            code="apollo-11-lm",
            artifact_type="lander",
            body=self.moon,
            latitude=0.67408,
            longitude=23.47297,
            status="Resting at Tranquility Base",
            brief_description="Descent stage of Apollo 11.",
            first_person_story="I was built not to return, but to deliver humanity.",
            key_facts=["First human lunar landing.", "Landed with low fuel."],
            fleet_members=[
                {"mission": "Apollo 12", "landing_site": "Oceanus Procellarum"},
                {"mission": "Apollo 14", "landing_site": "Fra Mauro"},
            ],
            translations={
                "ru": {
                    "name": "Лунный модуль Apollo 11",
                    "status": "Покоится на Базе Спокойствия",
                    "first_person_story": "История на русском языке",
                },
                "kk": {
                    "name": "Apollo 11 ай модулі",
                    "status": "Тыныштық базасында",
                    "first_person_story": "Қазақ тіліндегі оқиға",
                },
            },
            priority=1,
        )
        self.source = Source.objects.create(
            artifact=self.apollo11,
            title="NASA NSSDCA Apollo 11",
            url="https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059C",
            details="Master catalog record.",
        )

    def test_body_str_and_properties(self):
        self.assertEqual(str(self.moon), "Moon")
        self.assertEqual(self.moon.artifacts.count(), 1)

    def test_artifact_str_and_fleet(self):
        self.assertIn("Apollo 11 LM Eagle", str(self.apollo11))
        self.assertEqual(len(self.apollo11.fleet_members), 2)
        self.assertEqual(self.apollo11.sources.count(), 1)

    def test_api_bodies(self):
        response = self.client.get("/api/bodies/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("bodies", data)
        self.assertGreaterEqual(len(data["bodies"]), 2)

    def test_api_artifacts_filter(self):
        response = self.client.get("/api/artifacts/?body=moon")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["artifacts"]), 1)
        self.assertEqual(data["artifacts"][0]["code"], "apollo-11-lm")

    def test_api_artifact_detail(self):
        response = self.client.get("/api/artifacts/apollo-11-lm/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["name"], "Apollo 11 LM Eagle")
        self.assertEqual(len(data["fleet_members"]), 2)
        self.assertEqual(len(data["sources"]), 1)
        self.assertEqual(data["sources"][0]["title"], "NASA NSSDCA Apollo 11")

    def test_api_artifact_detail_not_found(self):
        response = self.client.get("/api/artifacts/non-existent-code/")
        self.assertEqual(response.status_code, 404)

    def test_api_artifact_detail_multilingual(self):
        response_ru = self.client.get("/api/artifacts/apollo-11-lm/?lang=ru")
        self.assertEqual(response_ru.status_code, 200)
        self.assertEqual(response_ru.json()["name"], "Лунный модуль Apollo 11")
        self.assertEqual(response_ru.json()["status"], "Покоится на Базе Спокойствия")

        response_kk = self.client.get("/api/artifacts/apollo-11-lm/?lang=kk")
        self.assertEqual(response_kk.status_code, 200)
        self.assertEqual(response_kk.json()["name"], "Apollo 11 ай модулі")
        self.assertEqual(response_kk.json()["status"], "Тыныштық базасында")


class MasterDatasetIntegrityTests(TestCase):
    def setUp(self):
        self.client = Client()
        # Seed the real dataset from data/artifacts.json into the test database
        call_command("seed_catalog")

    def test_body_counts_and_codes(self):
        bodies = Body.objects.all()
        self.assertEqual(bodies.count(), 5)
        codes = set(b.code for b in bodies)
        self.assertEqual(codes, {"moon", "mars", "ceres", "eros", "solar_system"})

    def test_total_artifact_counts(self):
        artifacts = Artifact.objects.all()
        self.assertEqual(artifacts.count(), 15)

    def test_distribution_by_body(self):
        moon_artifacts = Artifact.objects.filter(body__code="moon")
        self.assertEqual(moon_artifacts.count(), 4)

        mars_artifacts = Artifact.objects.filter(body__code="mars")
        self.assertEqual(mars_artifacts.count(), 7)

        ceres_artifacts = Artifact.objects.filter(body__code="ceres")
        self.assertEqual(ceres_artifacts.count(), 1)
        self.assertEqual(ceres_artifacts.first().code, "dawn")

        eros_artifacts = Artifact.objects.filter(body__code="eros")
        self.assertEqual(eros_artifacts.count(), 1)
        self.assertEqual(eros_artifacts.first().code, "near-shoemaker")

        deep_space = Artifact.objects.filter(body__code="solar_system")
        self.assertEqual(deep_space.count(), 2)
        deep_codes = set(a.code for a in deep_space)
        self.assertEqual(deep_codes, {"pioneer-10", "kepler"})

    def test_flagship_fleet_members(self):
        eagle = Artifact.objects.get(code="apollo-11-lm")
        self.assertGreaterEqual(len(eagle.fleet_members), 5)

        lrv = Artifact.objects.get(code="lrv-apollo-15")
        self.assertGreaterEqual(len(lrv.fleet_members), 2)

        alsep = Artifact.objects.get(code="alsep-apollo-12")
        self.assertGreaterEqual(len(alsep.fleet_members), 5)

        surveyor = Artifact.objects.get(code="surveyor-3")
        self.assertGreaterEqual(len(surveyor.fleet_members), 4)

        viking = Artifact.objects.get(code="viking-1")
        self.assertGreaterEqual(len(viking.fleet_members), 1)

    def test_all_artifacts_have_complete_content(self):
        for artifact in Artifact.objects.all():
            self.assertTrue(artifact.name, f"{artifact.code} missing name")
            self.assertTrue(artifact.brief_description, f"{artifact.code} missing brief_description")
            self.assertTrue(artifact.first_person_story, f"{artifact.code} missing first_person_story")
            self.assertGreaterEqual(len(artifact.key_facts), 3, f"{artifact.code} has fewer than 3 key facts")
            self.assertIn("ru", artifact.translations, f"{artifact.code} missing ru translation")
            self.assertIn("kk", artifact.translations, f"{artifact.code} missing kk translation")
            self.assertTrue(artifact.translations["ru"].get("name"), f"{artifact.code} missing ru name")
            self.assertTrue(artifact.translations["kk"].get("name"), f"{artifact.code} missing kk name")
            self.assertTrue(artifact.translations["ru"].get("first_person_story"), f"{artifact.code} missing ru story")
            self.assertTrue(artifact.translations["kk"].get("first_person_story"), f"{artifact.code} missing kk story")

    def test_all_artifacts_have_verified_nasa_sources(self):
        for artifact in Artifact.objects.all():
            sources = artifact.sources.all()
            self.assertGreaterEqual(sources.count(), 1, f"{artifact.code} has no attached NASA sources")
            for source in sources:
                self.assertTrue(source.url.startswith("https://"), f"Invalid source URL for {artifact.code}: {source.url}")
                self.assertIn("nasa.gov", source.url, f"Source for {artifact.code} is not from nasa.gov: {source.url}")

    def test_api_real_data_multilingual_endpoints(self):
        # Test Apollo 11
        res_en = self.client.get("/api/artifacts/apollo-11-lm/")
        self.assertEqual(res_en.status_code, 200)
        self.assertIn("Eagle", res_en.json()["name"])

        res_ru = self.client.get("/api/artifacts/apollo-11-lm/?lang=ru")
        self.assertEqual(res_ru.status_code, 200)
        self.assertIn("лунного модуля", res_ru.json()["name"].lower())

        res_kk = self.client.get("/api/artifacts/apollo-11-lm/?lang=kk")
        self.assertEqual(res_kk.status_code, 200)
        self.assertIn("Apollo 11 ай модулі", res_kk.json()["name"])

        # Test Sojourner
        res_sojourner_ru = self.client.get("/api/artifacts/sojourner/?lang=ru")
        self.assertEqual(res_sojourner_ru.status_code, 200)
        self.assertIn("Марсоход", res_sojourner_ru.json()["name"])

        # Test Ingenuity
        res_ingenuity_kk = self.client.get("/api/artifacts/ingenuity/?lang=kk")
        self.assertEqual(res_ingenuity_kk.status_code, 200)
        self.assertIn("тікұшағы", res_ingenuity_kk.json()["name"])
