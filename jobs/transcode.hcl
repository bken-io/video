job "transcode" {
  priority    = 20
  type        = "batch"
  datacenters = ["dc1"]

  constraint {
    operator  = "="
    value     = "amd64"
    attribute = "${attr.cpu.arch}"
  }
  
  parameterized {
    payload       = "optional"
    meta_required = [
      "video_id", "webhook_url",
      "rclone_destination_uri", "rclone_source_uri"
    ]
  }

  group "tidal" {
    reschedule {
      attempts = 1
    }

    task "transcode" {
      driver = "raw_exec"

      artifact {
        source = "https://cdn.bken.io/releases/tidal/latest.tar.gz"
      }

      template {
        env         = true
        destination = "secrets/.env"
        data        = "{{ key \"secrets/.env\" }}"
      }

      template {
        env         = false
        destination = "root/.config/rclone/rclone.conf"
        data        = "{{ key \"secrets/rclone.conf\" }}"
      }

      restart {
        attempts = 1
        mode     = "fail"
      }

      resources {
        cpu    = 8000
        memory = 6000
      }

      config {
        command = "tidal"
        args    = [
          "transcode",
          "--videoId",
          "${NOMAD_META_VIDEO_ID}",
          "--webhookUrl",
          "${NOMAD_META_WEBHOOK_URL}",
          "--rcloneDestinationUri",
          "${NOMAD_META_RCLONE_DESTINATION_URI}",
          "--rcloneSourceUri",
          "${NOMAD_META_RCLONE_SOURCE_URI}"
        ]
      }
    }
  }
}