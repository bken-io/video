job "concatinating" {
  priority    = 100
  type        = "batch"
  datacenters = ["dc1"]

  parameterized {
    payload       = "optional"
    meta_required = [
      "s3_in",
      "s3_out",
    ]
  }

  group "concatinating" {
    task "concatinating" {
      driver = "raw_exec"

      template {
        data = <<EOH
          NOMAD_TOKEN  ="{{key "secrets/NOMAD_TOKEN"}}"
          CONSUL_TOKEN ="{{key "secrets/CONSUL_TOKEN"}}"
        EOH
        
        destination = ".env"
        env         = true
      }

      restart {
        attempts = 2
        delay    = "10s"
      }

      resources {
        cpu    = 2000
        memory = 1500
      }
    
      config {
        command = "/usr/bin/bash"
        args    = [
          "/root/tidal/src/concatinating.sh",
          "${NOMAD_META_S3_IN}",
          "${NOMAD_META_S3_OUT}",
        ]
      }
    }

    reschedule {
      attempts       = 5
      delay          = "10s"
      max_delay      = "5m"
      unlimited      = false
      delay_function = "exponential"
    }
  }
}