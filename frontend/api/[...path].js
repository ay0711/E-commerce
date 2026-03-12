module.exports = async (req, res) => {
  const backendUrl = process.env.BACKEND_URL;

  if (!backendUrl) {
    return res.status(500).json({
      message: 'BACKEND_URL is not configured'
    });
  }

  const pathSegments = Array.isArray(req.query.path) ? req.query.path : [req.query.path];
  const targetPath = pathSegments.filter(Boolean).join('/');
  const targetUrl = new URL(`/api/${targetPath}`, backendUrl);

  Object.entries(req.query).forEach(([key, value]) => {
    if (key === 'path') {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(item => targetUrl.searchParams.append(key, item));
      return;
    }

    if (value !== undefined) {
      targetUrl.searchParams.set(key, value);
    }
  });

  const headers = {
    Accept: 'application/json'
  };

  if (req.headers['content-type']) {
    headers['Content-Type'] = req.headers['content-type'];
  }

  if (req.headers.authorization) {
    headers.Authorization = req.headers.authorization;
  }

  const requestOptions = {
    method: req.method,
    headers
  };

  if (!['GET', 'HEAD'].includes(req.method) && req.body && Object.keys(req.body).length > 0) {
    requestOptions.body = JSON.stringify(req.body);
  }

  try {
    const response = await fetch(targetUrl, requestOptions);
    const responseText = await response.text();
    const contentType = response.headers.get('content-type') || 'application/json';

    res.status(response.status);
    res.setHeader('Content-Type', contentType);
    return res.send(responseText);
  } catch (error) {
    return res.status(502).json({
      message: 'Unable to reach backend service',
      error: error.message
    });
  }
};