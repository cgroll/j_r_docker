/*
 *  Copyright 2014 TWO SIGMA OPEN SOURCE, LLC
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
package com.twosigma.beaker.core.rest;

import com.google.inject.Inject;
import com.google.inject.Singleton;
import org.codehaus.jackson.map.ObjectMapper;
import org.codehaus.jackson.JsonParser.Feature;
import java.io.IOException;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.FormParam;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;

/**
 * RESTful API for namespace service (in the notebook model).
 */
@Path("namespace")
@Produces(MediaType.APPLICATION_JSON)
@Singleton
public class NamespaceRest {

  private String legalNamePattern = "[a-zA-Z_][a-zA-Z0-9_]*";
  private ObjectMapper mapper = new ObjectMapper().configure(Feature.ALLOW_NON_NUMERIC_NUMBERS, true);

  @Inject
  private NamespaceService namespaceService;

  @GET
  @Path("get")
  public Object get(@QueryParam("session") String session, @QueryParam("name") String name) 
    throws InterruptedException
  {
    return this.namespaceService.get(session, name);
  }

  // sync means wait until write completes before returning.  null value means unset.
  @POST
  @Path("set")
  public String set(@FormParam("session") String session, @FormParam("name") String name,
                    @FormParam("value") String value, @FormParam("sync") Boolean sync)
    throws IOException, InterruptedException
  {
    Object parsedValue = null;
    Boolean unset = true;
    if (!name.matches(legalNamePattern)) {
      return("name is illegal for notebook namespace: \'" + name + "\'");
    }
    if (null != value) {
      parsedValue = mapper.readValue(value, Object.class);
      unset = false;
    }
    this.namespaceService.set(session, name, parsedValue, unset, sync);
    return "ok";
  }
}
