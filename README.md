# NETICS Open Recruitment 2026  
## Modul 1 – CI/CD Deployment API
---
| Riyan Fadli Amazzadin | 5025241068 | 
|---|---| 

## URL API
```
http://70.153.17.62/health
```

## Deskripsi Singkat
Pada tugas kali ini, saya membuat API menggunakan `express`. Alasan saya memilih express adalah karena dokumentasi yang mudah diakses serta saya merasa lebih familiar menggunakan javascript dibanding python. Struktur repository ini adalah sebagai berikut:
<br>
```
netics-oprec-module1-2026/
├── .github/
│   └── workflows/
│       └── deploy.yml
│
├── src/
│   ├── ansible/
│   │   └── playbook.yml
│   │
│   ├── nginx/
│   │   └── health-api
│   │
│   └── app/
│       ├── api.js
│       ├── package.json
│       └── Dockerfile
│
├── README.md
└── .gitignore
```

## API
```javascript
const express = require('express')
const app = express()
const port = 3000
const start = Date.now()

function formatUptime(ms) {
    const totalSecond = Math.floor(ms / 1000);
    const hour = Math.floor(totalSecond / 3600);
    const minute = Math.floor((totalSecond % 3600) / 60);
    const second = totalSecond % 60;
    return `${hour}h ${minute}m ${second}s`;
}

app.get('/health', (req, res) => {
    const uptime = Date.now() - start;

    res.json({
        nama: "Riyan Fadli Amazzadin",
        nrp: "5025241068",
        status: "UP",
        timestamp: new Date().toISOString(),
        uptime: formatUptime(uptime)
    })
})

app.listen(port, () => {
    console.log(`API running on port ${port}`)
})
```

### Penjelasan Implementasi

Pada bagian awal, kode meng-import package `express` untuk digunakan dalam class `app`. Express menyediakan fungsi-fungsi seperti `get`, dan `post` yang memungkinkan kita untuk melayani request dari client. Setelah itu, kode mendefinisikan endpoint `/health` yang berisi data-data yang relevan. Untuk mendapatkan waktu running server, setiap kali client memanggil endpoint `/health`, server mengurangi value `Date.now()` saat ini dengan `Date.now()` ketika server dimulai untuk mendapatkan durasi uptime server dalam satuan ms. Setelah itu, durasi tersebut akan diubah menjadi format yang lebih mudah dibaca melalui fungsi `formatUptime()`. Terakhir, setelah endpoint telah dibuat, server membuka koneksi pada port 3000 menggunakan fungsi `listen()`.
<br>

## Docker

### Dockerfile
```dockerfile
FROM node:24.14.0-alpine
WORKDIR /src
COPY package.json ./
RUN npm install
COPY . .
CMD ["node", "src/api.js"]
```

Karena server menggunakan express, kita perlu menggunakan node.js untuk bisa menjalankan server. Node yang digunakan adalah versi terbaru yakni 24.14.0-alpine. Setelah itu, docker image dapat dibuild dan run menggunakan command:
```bash
docker build -t node-api .
docker run -p 3000:3000 node-api
```

yang akan dijalankan melalui ansible. 
<br> 

## Nginx Reverse Proxy

### Konfigurasi
```nginx
server {
    listen 80;
    server_name 70.153.17.62;

location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Penjelasan
Nginx sebagai reverse proxy akan meneruskan request client ke API. Untuk melakukan ini, nginx akan berjalan pada domain yang tertulis pada `server_name`. Karena saya tidak menggunakan domain, pada bagian `server_name` dapat diisi dengan public ip dari VPS yang digunakan. Nginx menggunakan port 80 yang merupakan port default dari http. 

Untuk dapat meneruskan koneksi ke API, konfigurasi nginx perlu menunjukkan di mana alamat API yang sedang dijalankan. Alamat ini diletakkan pada `location` tepatnya pada `proxy_pass`. Karena pada file `api.js` saya menggunakan port 3000, proxy_pass ini diisi dengan `localhost:3000`. Parameter lain dalam `location` menangani lebih detail bagaimana koneksi tersebut diteruskan, salah satunya yaitu versi http yang digunakan yang dapat diatur pada bagian `proxy_http_version`. 
<br>

## Ansible

### Struktur Folder
```
ansible/
├── playbook.yml
```

### Playbook
```yaml
---
---
- name: deploy newest version of api
  hosts: vps
  become: yes

  tasks:

    - name: add github to known hosts
      ansible.builtin.known_hosts:
          name: github.com
          key: "{{ lookup('pipe', 'ssh-keyscan github.com') }}"
          path: /root/.ssh/known_hosts   
          state: present

    - name: pull latest changes
      git:
        repo: git@github.com:shikajiko/netics-oprec-module1-2026.git
        dest: "{{ repo_path }}"
        version: main
        accept_hostkey: yes
        key_file: /home/riyanfadli/.ssh/id_ed25519
      become_user: riyanfadli  

    - name: build docker image
      command: docker build -t node-api .
      args:
        chdir: "{{ app_path }}"

    - name: run docker container
      community.docker.docker_container:
        name: node-api
        image: node-api
        state: started
        restart_policy: always
        recreate: yes
        ports:
        - "3000:3000"
    
    - name: install nginx
      apt: 
        name: nginx
        state: latest
        update_cache: yes

    - name: remove default nginx config
      file:
        path: /etc/nginx/sites-enabled/default
        state: absent

    - name: add nginx config
      copy:
        src: "{{ playbook_dir }}../../nginx/health-api"
        dest: /etc/nginx/sites-available/health-api
        owner: root       
        group: root
        mode: '0644'
      
    - name: enable web
      file: 
        src: /etc/nginx/sites-available/health-api
        dest: /etc/nginx/sites-enabled/health-api
        state: link

    - name: check if nginx is running
      systemd:
        name: nginx
        enabled: yes
        state: started

  vars:
    user: "riyanfadli"
    app_path: "/home/riyanfadli/netics-oprec-module1-2026/src/app"
    repo_path: "/home/riyanfadli/netics-oprec-module1-2026"

```

### Penjelasan
Secara umum, untuk menjalankan sebuah perintah, kita perlu mendefinisikan perintah tersebut pada bagian `task`. Karena ansible bersifat deklaratif, kita hanya perlu menjelaskan end result yang diinginkan menggunakan module yang telah tersedia. Pada dasarnya, konfigurasi ansible tersebut menjalankan 3 tugas utama:

- Menjalankan `git pull` untuk mengambil perubahan terbaru pada VPS
- Menjalankan server melalui docker
- Menginstal dan mengubah konfigrasi nginx

Untuk lebih detailnya:
<br>
- Git Pull <br>
  Ansible memiliki module `git` yang dapat digunakan untuk menjalankan fungsi yang terkait dengan git. Di sini, perlu untuk menambahkan repository dan key yang relevan agar dapat melakukan pull pada repository yang bersifat private. <br>
- Build and Run Docker <br>
  Untuk melakukan build image docker, saya menggunakan module `command` untuk menjalankan perintah `docker build`. Sedangkan pada bagian run, saya menggunakan module `community.docker`.  Alternatif lain adalah menggunakan `command` untuk menjalankan perintah `docker run`. Akan tetapi, ini melawan fungsi idempotent yang ditawarkan ansible, karena menjalankan docker run dua kali akan gagal jika container dengan nama yang sama sudah ada. community.docker memungkinkan ansible untuk tetap bersifat idempotent dengan mendeteksi state container yang ada dan hanya melakukan perubahan jika diperlukan. <br>
- Instal dan Set up Nginx <br>
  Untuk melakukan instalasi nginx, saya menggunakan module `apt`. Setelah itu, untuk meletakkan konfigurasi nginx yang sesuai, saya menghapus file konfigurasi default dengan `file` dan mengubah `state` menjadi `absent`. Setelah itu, ansible melakukan copy dari file nginx yang ada di komputer local ke VPS menggunakan module `copy`. Untuk mengaktifkan web, kita menggunakan `state: link` untuk mengaktifkan `symlink` ke file konfigurasi yang telah dicopy.
<br>

## CI/CD GitHub Actions

### Workflow File
```yaml
name: deploy api to vps

on:
  push:
    branches:
      - main
    paths:
      - 'src/app/**'
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: set up python
        uses: actions/setup-python@v5
        with:
          python-version: "3.12"

      - name: install ansible
        run: pip install ansible==13.5.0

      - name: set up vps ssh
        run: |
          mkdir -p ~/.ssh
          printf '%s' "${{ secrets.VPS_SSH_KEY }}" > ~/.ssh/deploy_key.pem
          chmod 600 ~/.ssh/deploy_key.pem

      - name: add ssh key to github worker
        run: |
          printf '%s' "${{ secrets.WORKER_SSH_KEY }}" > ~/.ssh/worker_ssh_key
          chmod 600 ~/.ssh/worker_ssh_key
          ssh-keyscan github.com >> ~/.ssh/known_hosts
          cat >> ~/.ssh/config <<EOF
          Host github.com
            IdentityFile ~/.ssh/worker_ssh_key
            StrictHostKeyChecking no
          EOF

      - name: add vps to known hosts
        run: |
          ssh-keyscan -H ${{ secrets.VPS_HOST }} >> ~/.ssh/known_hosts

      - name: write ansible inventory
        run: |
          cat <<EOF > /tmp/inventory.ini
          [vps]
          ${{ secrets.VPS_HOST }} ansible_user=${{ secrets.VPS_USER }} ansible_ssh_private_key_file=~/.ssh/deploy_key.pem
          EOF

      - name: run ansible playbook
        run: |
          ansible-playbook -i /tmp/inventory.ini src/ansible/playbook.yml
        env:
          ANSIBLE_FORCE_COLOR: "true"

      - name: cleanup
        if: always()
        run: |
          rm -f ~/.ssh/deploy_key.pem
          rm -f /tmp/inventory.ini
          rm -f ~/.ssh/worker_ssh_key
```

### Penjelasan
Secara garis besar, konfigurasi github actions cukup mirip dengan ansible. Untuk melakukan sebuah job, kita perlu mendeklarasikan nama job tersebut, kemudian menjelaskan kepada runner proses yang harus dijalankan menggunakan `run`. Selain itu, untuk mempermudah set up, github actions juga memberikan alur yang dapat langsung diguanakan melalui perintah `uses`. Sebagai contoh, untuk melakukan instalasi python, kita hanya perlu menggunakan `uses/setup-python`

Alur CI/CD dari project yang dibuat adalah sebagai berikut:
- Github action workflows akan otomatis berjalan saat terdapat perubahan pada `api.js` setelah push
- GitHub action `runner` (ubuntu-latest) akan melakukan checkout repository menggunakan `actions/checkout`
- Runner menginstall `python` dan `ansible` yang akan digunakan untuk menjalankan playbook deployment
- SSH key untuk mengakses VPS didapat dari GitHub Secrets (VPS_SSH_KEY) dan disimpan sebagai private key sementara
- SSH key kedua (WORKER_SSH_KEY) ditambahkan agar runner dapat mengakses repository github melalui SSH saat ansible melakukan `git pull` di VPS
- Runner menambahkan github dan VPS ke known_hosts untuk menghindari error host key verification failed saat koneksi SSH
- Runner membuat inventory ansible sementara (/tmp/inventory.ini) yang berisi host VPS, user SSH, dan private key
- Github actions kemudian menjalankan ansible playbook menggunakan inventory tersebut
- Setelah proses selesai, github actions akan menghapus SSH key dan inventory file sementara untuk keamanan

  Informasi sensitif seperti VPS_HOST dan VPS_SSH_KEY disimpan dalam secrets sehingga menjamin keamanan server. 
<br>

## Screenshot

Hasil ketika API dipanggil: <br>
<img width="567" height="254" alt="image" src="https://github.com/user-attachments/assets/6e9c913b-9fb3-4c19-88d7-ab6facba1b90" />
<br>
Log deployment github actions: <br>
<img width="1827" height="922" alt="image" src="https://github.com/user-attachments/assets/35eb3be6-a18b-40b7-a35f-3026c4beef95" />
<br>

## References
- Express.js documentation <br>
  (https://expressjs.com/en/starter/hello-world.html)

- MDN Reference <br>
  (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now) <br>
  (https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/Express_Nodejs/deployment)
 
- Writing Ansible Playbook for Nginx <br>
  (https://dev.to/dpuig/creating-an-ansible-playbook-to-install-and-configure-nginx-for-hosting-static-websites-3n6j)

- Ansible documentation <br>
  (https://docs.ansible.com/projects/ansible/latest/getting_started/introduction.html)

- Github actions documentation <br>
  (https://docs.github.com/en/actions/tutorials/create-an-example-workflow)

- Using github actions with ansible <br>
  (https://oneuptime.com/blog/post/2026-02-21-how-to-run-ansible-playbooks-in-github-actions/view)
  
- ChatGPT - How Does an API work and how do you create it? <br>
  (conversation link: https://chatgpt.com/share/69c5f27c-d460-8320-ac71-26e220a10297)

- Claude - Suplementary explanation for the official ansible docs <br>
  (conversation link: https://claude.ai/share/574561f5-f731-4a6b-8c68-8099842a60cc)
