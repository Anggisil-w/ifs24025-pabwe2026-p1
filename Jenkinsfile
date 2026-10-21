// Pipeline CI untuk Homestay App (back-end Express + front-end SvelteKit)
// Butuh Jenkins dengan plugin Docker Pipeline. Jika tidak memakai Docker,
// ganti `agent` dengan `agent any` dan pasang NodeJS (>= 20) di server Jenkins.
pipeline {
  agent {
    docker { image 'node:22-bookworm' }
  }

  options {
    timestamps()
    timeout(time: 20, unit: 'MINUTES')
  }

  stages {
    stage('Backend: Install') {
      steps {
        dir('backend') { sh 'npm ci' }
      }
    }

    stage('Backend: Test') {
      steps {
        dir('backend') { sh 'npm test' }
      }
    }

    stage('Frontend: Install') {
      steps {
        dir('frontend') { sh 'npm ci' }
      }
    }

    stage('Frontend: Build') {
      environment {
        VITE_API_URL = "${env.VITE_API_URL ?: 'http://localhost:3000/api'}"
      }
      steps {
        dir('frontend') { sh 'npm run build' }
      }
    }
  }

  post {
    success {
      archiveArtifacts artifacts: 'frontend/build/**', fingerprint: true
      echo 'Pipeline sukses: test back-end lulus dan front-end berhasil di-build.'
    }
    failure {
      echo 'Pipeline gagal. Periksa log pada stage yang merah.'
    }
  }
}
