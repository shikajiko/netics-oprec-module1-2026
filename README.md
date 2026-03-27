source: 
- chatgpt - How Does an API work and how do you create it?
  link: https://chatgpt.com/share/69c5f27c-d460-8320-ac71-26e220a10297

- claude - Suplementary explanation for the official ansible docs
  link: https://claude.ai/share/574561f5-f731-4a6b-8c68-8099842a60cc

- express.js documentation 
https://expressjs.com/en/starter/hello-world.html
- mdn
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now
https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/Express_Nodejs/deployment

- writing ansible playbook for nginx
https://dev.to/dpuig/creating-an-ansible-playbook-to-install-and-configure-nginx-for-hosting-static-websites-3n6j

- ansible documentation

- github actions documentation
https://docs.github.com/en/actions/tutorials/create-an-example-workflow

- using github actions with ansible
https://oneuptime.com/blog/post/2026-02-21-how-to-run-ansible-playbooks-in-github-actions/view

steps:
1. menulis api -> pakai node + express karena lebih familiar
2. install node 
3. konfigurasi dockerfile supaya install dependency dan run npm 
command:
docker build -t node-api .
docker run -p 8000:3000 --name node-api node-api
4. pastikan konfigurasi vm azure mengizinkan akses ke port 8000