job "api" {
  priority    = 100
  datacenters = ["dc1"]
  type        = "service"

  constraint {
    operator  = "="
    value     = "amd64"
    attribute = "${attr.cpu.arch}"
  }

  group "services" {
    update {
      max_parallel     = 1
      canary           = 1
      auto_revert      = true
      auto_promote     = true
      healthy_deadline = "5m"
      min_healthy_time = "30s"
    }

    count = 2

    network {
      port "tidal_app_port" { }
    }

    service {
      name = "tidal-app"
      port = "tidal_app_port"
      tags = ["urlprefix-/tidal strip=/tidal"]

      check {
        path     = "/"
        timeout  = "2s"
        interval = "10s"
        type     = "http"
        name     = "tidal_app_port alive"
      }
    }

    task "api" {
      driver = "raw_exec"

      artifact {
        source = "https://s3.us-east-2.wasabisys.com/cdn.bken.io/releases/tidal/latest.tar.gz"
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

      config {
        command  = "tidal"
        args     = [ "api", "--port", "${NOMAD_PORT_tidal_app_port}"]
      }

      resources {
        memory = 512
        cpu    = 512
      }
    }
  }
}